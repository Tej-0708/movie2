require('dotenv').config();
const express = require('express');
const cors = require('cors');
const movieRoutes = require('./routes/movieRoutes');
const API_CONFIG = require('./config/api');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/movies', movieRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Global error handler caught:', err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`TMDB API Base URL: ${API_CONFIG.baseUrl}`);
    console.log(`API Key configured: ${API_CONFIG.apiKey ? 'Yes' : 'No'}`);
}); 