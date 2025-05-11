const Watchlist = require('../models/Watchlist');
const Movie = require('../models/Movie');
const Recommendation = require('../models/Recommendation'); // Optional: Use if storing recommendations
const tmdbService = require('../services/tmdbService');
const { formatMedia } = require('./movieController'); // Reuse formatter from movieController
const mongoose = require('mongoose');
const omdbService = require('../services/omdbService');

/**
 * Generates recommendations for the current user.
 * Strategy: If watchlist is empty (cold start), return popular.
 * Otherwise, get TMDB recommendations based on the most recent watchlist item.
 * Filters out items already on the user's watchlist.
 */
const generateRecommendations = async (req, res, next) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        // Get user's watchlist
        const userWatchlist = await Movie.find({ 
            user_id: req.user.id,
            watch_status: 'completed'
        });

        if (!userWatchlist.length) {
            return res.status(404).json({ 
                error: 'No completed movies in watchlist to generate recommendations' 
            });
        }

        // Get genres from completed movies
        const genres = [...new Set(userWatchlist.map(movie => movie.genres).flat())];

        // Get recommendations based on genres
        const recommendations = await Promise.all(
            genres.map(genre => omdbService.searchMovies(genre, 1))
        );

        // Format and combine recommendations
        const formattedRecommendations = recommendations
            .filter(result => result.Search)
            .flatMap(result => result.Search)
            .map(movie => omdbService.formatSearchResult(movie))
            .filter(Boolean);

        // Remove duplicates and movies already in watchlist
        const uniqueRecommendations = formattedRecommendations.filter(
            movie => !userWatchlist.some(watchlistMovie => 
                watchlistMovie.api_id === movie.api_id
            )
        );

        res.json({
            recommendations: uniqueRecommendations.slice(0, 20) // Limit to 20 recommendations
        });
    } catch (error) {
        console.error('Error generating recommendations:', error);
        res.status(500).json({ error: 'Failed to generate recommendations' });
    }
};

/**
 * Optional helper function to store generated recommendations in the DB.
 * @param {string} userId - The user's ObjectId.
 * @param {array} recommendations - Array of formatted recommendation objects.
 * @param {string} source - String describing how recommendations were generated.
 */
async function storeRecommendations(userId, recommendations, source = 'unknown') {
   if (!recommendations || recommendations.length === 0) return;

   console.log(`Attempting to store ${recommendations.length} recommendations for user ${userId} (Source: ${source})`);
   try {
       // 1. Get ObjectIds for the recommended movies (they should exist from addToWatchlist)
       const recApiIds = recommendations.map(r => r.api_id);
       const existingMovies = await Movie.find({ api_id: { $in: recApiIds } }, '_id api_id'); // Find corresponding docs
       const movieMap = new Map(existingMovies.map(m => [m.api_id, m._id])); // Map api_id to ObjectId

       // Prepare recommendation documents for insertion
       const recsToStore = recommendations
           .map((rec, index) => {
               const movieObjectId = movieMap.get(rec.api_id);
               if (!movieObjectId) {
                   console.warn(`Could not find local movie ObjectId for recommended API ID: ${rec.api_id}`);
                   return null; // Skip if movie not found locally
               }
               return {
                   user: userId,
                   recommendedMovie: movieObjectId,
                   score: 1 / (index + 1), // Example scoring: higher score for earlier items
                   source: source
               };
           })
           .filter(Boolean); // Filter out nulls

        if (recsToStore.length > 0) {
             // 2. Clear previous recommendations for this user and source (optional strategy)
            // await Recommendation.deleteMany({ user: userId, source: source }); // Example: delete only same-source recs
            await Recommendation.deleteMany({ user: userId }); // Example: delete all previous recs for user

             // 3. Insert the new batch of recommendations
            const inserted = await Recommendation.insertMany(recsToStore);
            console.log(`Successfully stored ${inserted.length} recommendations for user ${userId}`);
        } else {
            console.log(`No valid recommendations to store for user ${userId} after filtering.`);
        }

   } catch (error) {
       console.error(`Error storing recommendations for user ${userId}:`, error);
       // Don't let storage failure break the main recommendation flow
   }
}

// Placeholder for manual update trigger if needed
const updateRecommendations = async (req, res, next) => {
     res.status(501).json({ message: 'Manual recommendation update endpoint not implemented' });
};

module.exports = {
    generateRecommendations,
    updateRecommendations // Export if implemented
};