const express = require('express');
const recommendationController = require('../controllers/recommendationController');
// Note: Authentication middleware is applied in server.js for all /api/recommendations routes

const router = express.Router();

// GET /api/recommendations
// Generates and returns movie/tv show recommendations for the current user
router.get('/', recommendationController.generateRecommendations);

// Optional: Endpoint to trigger manual update or other recommendation-related actions
// POST /api/recommendations/update
// router.post('/update', recommendationController.updateRecommendations); // Example if needed

module.exports = router;