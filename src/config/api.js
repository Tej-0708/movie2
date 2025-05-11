require('dotenv').config();

module.exports = {
    baseUrl: 'http://www.omdbapi.com',
    apiKey: process.env.OMDB_API_KEY,
    timeout: 5000,
    retryAttempts: 3,
    retryDelay: 1000
};

// Validate API configuration
if (!module.exports.apiKey) {
    console.error('FATAL ERROR: OMDB API key is not configured. Please set OMDB_API_KEY in your .env file');
    process.exit(1);
} 