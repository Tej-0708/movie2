const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
    api_id: {
        type: String,
        required: true,
        index: true
    },
    title: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['movie', 'series'],
        required: true
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    watch_status: {
        type: String,
        enum: ['pending', 'watching', 'completed'],
        default: 'pending'
    },
    poster: String,
    year: String,
    imdbRating: String,
    addedAt: {
        type: Date,
        default: Date.now
    }
});

// Compound index for efficient watchlist queries
movieSchema.index({ user_id: 1, api_id: 1 }, { unique: true });

module.exports = mongoose.model('Movie', movieSchema);