const mongoose = require('mongoose');
const Schema = mongoose.Schema; // Alias for Schema constructor

const WatchlistSchema = new mongoose.Schema({
  user: {
    type: Schema.Types.ObjectId, // Stores the MongoDB ObjectId of the user
    ref: 'User',                 // Creates a reference to the 'User' model
    required: [true, 'User reference is required'],
    index: true                  // Index for efficiently querying a user's watchlist
  },
  movie: {
    type: Schema.Types.ObjectId, // Stores the MongoDB ObjectId of the movie
    ref: 'Movie',                // Creates a reference to the 'Movie' model
    required: [true, 'Movie reference is required']
  },
  // date_added is handled automatically by timestamps: true
}, {
  // Automatically manage createdAt and updatedAt fields
  timestamps: { createdAt: 'date_added', updatedAt: true } // Rename createdAt to date_added
});

// Compound index to prevent a user from adding the exact same movie ObjectId twice
// This ensures data integrity at the database level.
WatchlistSchema.index({ user: 1, movie: 1 }, { unique: true });

// Create the Mongoose model for the 'watchlists' collection
const Watchlist = mongoose.model('Watchlist', WatchlistSchema);

module.exports = Watchlist;