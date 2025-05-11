const omdbService = require('../services/omdbService');
const Movie = require('../models/Movie');

const movieController = {
    // Search movies
    searchMovies: async (req, res) => {
        try {
            const { query, page = 1 } = req.query;
            if (!query) {
                return res.status(400).json({ error: 'Search query is required' });
            }

            const results = await omdbService.searchMovies(query, parseInt(page));
            if (!results.Search) {
                return res.status(404).json({ error: 'No movies found' });
            }

            const formattedResults = results.Search
                .map(movie => omdbService.formatSearchResult(movie))
                .filter(Boolean);

            res.json({
                page: parseInt(page),
                total_results: parseInt(results.totalResults) || 0,
                results: formattedResults
            });
        } catch (error) {
            console.error('Error searching movies:', error);
            res.status(500).json({ error: 'Failed to search movies' });
        }
    },

    // Search TV shows
    searchTVShows: async (req, res) => {
        try {
            const { query, page = 1 } = req.query;
            if (!query) {
                return res.status(400).json({ error: 'Search query is required' });
            }

            const results = await omdbService.searchTVShows(query, parseInt(page));
            if (!results.Search) {
                return res.status(404).json({ error: 'No TV shows found' });
            }

            const formattedResults = results.Search
                .map(show => omdbService.formatSearchResult(show))
                .filter(Boolean);

            res.json({
                page: parseInt(page),
                total_results: parseInt(results.totalResults) || 0,
                results: formattedResults
            });
        } catch (error) {
            console.error('Error searching TV shows:', error);
            res.status(500).json({ error: 'Failed to search TV shows' });
        }
    },

    // Get movie details
    getMovieDetails: async (req, res) => {
        try {
            const imdbId = req.params.id;
            if (!imdbId) {
                return res.status(400).json({ error: 'IMDB ID is required' });
            }

            const movie = await omdbService.getMovieDetails(imdbId);
            if (!movie || movie.Error) {
                return res.status(404).json({ error: movie?.Error || 'Movie not found' });
            }

            const formattedMovie = omdbService.formatMovie(movie);
            res.json(formattedMovie);
        } catch (error) {
            console.error('Error fetching movie details:', error);
            res.status(500).json({ error: 'Failed to fetch movie details' });
        }
    },

    // Get TV show details
    getTVShowDetails: async (req, res) => {
        try {
            const imdbId = req.params.id;
            if (!imdbId) {
                return res.status(400).json({ error: 'IMDB ID is required' });
            }

            const show = await omdbService.getTVShowDetails(imdbId);
            if (!show || show.Error) {
                return res.status(404).json({ error: show?.Error || 'TV show not found' });
            }

            const formattedShow = omdbService.formatTVShow(show);
            res.json(formattedShow);
        } catch (error) {
            console.error('Error fetching TV show details:', error);
            res.status(500).json({ error: 'Failed to fetch TV show details' });
        }
    },

    // Get episode details
    getEpisodeDetails: async (req, res) => {
        try {
            const { id: imdbId, season, episode } = req.params;
            if (!imdbId || !season || !episode) {
                return res.status(400).json({ error: 'IMDB ID, season, and episode are required' });
            }

            const episodeData = await omdbService.getEpisodeDetails(imdbId, season, episode);
            if (!episodeData || episodeData.Error) {
                return res.status(404).json({ error: episodeData?.Error || 'Episode not found' });
            }

            res.json(episodeData);
        } catch (error) {
            console.error('Error fetching episode details:', error);
            res.status(500).json({ error: 'Failed to fetch episode details' });
        }
    },

    // Get season details
    getSeasonDetails: async (req, res) => {
        try {
            const { id: imdbId, season } = req.params;
            if (!imdbId || !season) {
                return res.status(400).json({ error: 'IMDB ID and season are required' });
            }

            const seasonData = await omdbService.getSeasonDetails(imdbId, season);
            if (!seasonData || seasonData.Error) {
                return res.status(404).json({ error: seasonData?.Error || 'Season not found' });
            }

            res.json(seasonData);
        } catch (error) {
            console.error('Error fetching season details:', error);
            res.status(500).json({ error: 'Failed to fetch season details' });
        }
    },

    // Get recent movies
    getRecentMovies: async (req, res) => {
        try {
            const { year = new Date().getFullYear(), page = 1 } = req.query;
            const movies = await omdbService.getRecentMovies(year, parseInt(page));
            
            if (!movies.Search) {
                return res.status(404).json({ error: 'No movies found' });
            }

            const formattedResults = movies.Search
                .map(movie => omdbService.formatSearchResult(movie))
                .filter(Boolean);

            res.json({
                page: parseInt(page),
                total_results: parseInt(movies.totalResults) || 0,
                results: formattedResults
            });
        } catch (error) {
            console.error('Error fetching recent movies:', error);
            res.status(500).json({ error: 'Failed to fetch recent movies' });
        }
    },

    // Watchlist management
    addToWatchlist: async (req, res) => {
        try {
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
    },

    getWatchlist: async (req, res) => {
        try {
            const movies = await Movie.find({ user_id: req.user.id })
                .sort({ addedAt: -1 });
            res.json(movies);
        } catch (error) {
            console.error('Error fetching watchlist:', error);
            res.status(500).json({ error: 'Failed to fetch watchlist' });
        }
    },

    removeFromWatchlist: async (req, res) => {
        try {
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
    },

    updateWatchStatus: async (req, res) => {
        try {
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
    }
};

module.exports = movieController;