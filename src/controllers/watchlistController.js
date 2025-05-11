const Watchlist = require('../models/Watchlist');
const Movie = require('../models/Movie');
const mongoose = require('mongoose'); // Needed for ObjectId validation

/**
 * Fetches the current user's watchlist, populating movie details.
 */
const getWatchlist = async (req, res, next) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const movies = await Movie.find({ user_id: req.user.id })
            .sort({ addedAt: -1 });
        res.json(movies);
    } catch (error) {
        console.error('Error fetching watchlist:', error);
        res.status(500).json({ error: 'Failed to fetch watchlist' });
    }
};

/**
 * Adds a movie/TV show to the current user's watchlist.
 * Expects TMDB item details in the request body.
 */
const addToWatchlist = async (req, res, next) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const { api_id, title, type, poster, year, imdbRating } = req.body;
        if (!api_id || !title || !type) {
            return res.status(400).json({ error: 'API ID, title, and type are required' });
        }

        const movie = new Movie({
            api_id,
            title,
            type,
            user_id: req.user.id,
            watch_status: 'pending',
            poster,
            year,
            imdbRating
        });

        await movie.save();
        res.status(201).json(movie);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ error: 'Movie already in watchlist' });
        }
        console.error('Error adding to watchlist:', error);
        res.status(500).json({ error: 'Failed to add to watchlist' });
    }
};

/**
 * Removes a movie/TV show from the current user's watchlist using its TMDB API ID.
 */
const removeFromWatchlist = async (req, res, next) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const movie = await Movie.findOneAndDelete({
            _id: req.params.id,
            user_id: req.user.id
        });

        if (!movie) {
            return res.status(404).json({ error: 'Movie not found in watchlist' });
        }

        res.json({ message: 'Movie removed from watchlist' });
    } catch (error) {
        console.error('Error removing from watchlist:', error);
        res.status(500).json({ error: 'Failed to remove from watchlist' });
    }
};

/**
 * Updates the watch status of a movie/TV show in the current user's watchlist.
 */
const updateWatchStatus = async (req, res, next) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const { status } = req.body;
        if (!['pending', 'watching', 'completed'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const movie = await Movie.findOneAndUpdate(
            { _id: req.params.id, user_id: req.user.id },
            { watch_status: status },
            { new: true }
        );

        if (!movie) {
            return res.status(404).json({ error: 'Movie not found in watchlist' });
        }

        res.json(movie);
    } catch (error) {
        console.error('Error updating watch status:', error);
        res.status(500).json({ error: 'Failed to update watch status' });
    }
};

module.exports = {
    getWatchlist,
    addToWatchlist,
    removeFromWatchlist,
    updateWatchStatus,
};