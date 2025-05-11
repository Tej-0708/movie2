const express = require('express');
const router = express.Router();
const movieController = require('../controllers/movieController');
const watchlistController = require('../controllers/watchlistController');
const recommendationController = require('../controllers/recommendationController');
const auth = require('../middleware/auth');
// Note: Authentication middleware is applied in server.js for all /api/movies routes

// Public routes
router.get('/search/movies', movieController.searchMovies);
router.get('/search/tv', movieController.searchTVShows);
router.get('/movie/:id', movieController.getMovieDetails);
router.get('/tv/:id', movieController.getTVShowDetails);
router.get('/tv/:id/season/:season', movieController.getSeasonDetails);
router.get('/tv/:id/season/:season/episode/:episode', movieController.getEpisodeDetails);
router.get('/recent', movieController.getRecentMovies);

// Protected routes (require authentication)
router.post('/watchlist', auth, watchlistController.addToWatchlist);
router.get('/watchlist', auth, watchlistController.getWatchlist);
router.delete('/watchlist/:id', auth, watchlistController.removeFromWatchlist);
router.patch('/watchlist/:id/status', auth, watchlistController.updateWatchStatus);

// Recommendations
router.get('/recommendations', auth, recommendationController.generateRecommendations);

// GET /api/movies/discover?region=...&genre=...&type=...
// Uses TMDB's discover endpoint for more filtering options
// router.get('/discover', movieController.fetchAllMovies);

// GET /api/movies/:type/:id (e.g., /api/movies/movie/12345 or /api/movies/tv/67890)
// Fetches detailed information for a specific movie or TV show by its TMDB ID
// router.get('/:type/:id', movieController.getDetails);

module.exports = router;