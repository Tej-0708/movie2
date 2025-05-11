const express = require('express');
const watchlistController = require('../controllers/watchlistController');
// Note: Authentication middleware is applied in server.js for all /api/watchlist routes

const router = express.Router();

// GET /api/watchlist
// Fetches the current user's watchlist with populated movie details
router.get('/', watchlistController.getWatchlist);

// POST /api/watchlist
// Adds a movie/tv show (identified by its details in request body) to the user's watchlist
router.post('/', watchlistController.addToWatchlist);

// DELETE /api/watchlist/:apiMovieId
// Removes a movie/tv show (identified by its TMDB API ID in the URL) from the user's watchlist
router.delete('/:apiMovieId', watchlistController.removeFromWatchlist);

module.exports = router;