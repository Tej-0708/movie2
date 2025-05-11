const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RecommendationSchema = new mongoose.Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true // Index for fetching recommendations for a specific user
  },
  recommendedMovie: { // Reference to the movie being recommended
    type: Schema.Types.ObjectId,
    ref: 'Movie',
    required: true
  },
  score: { // Optional: A score indicating the strength or relevance of the recommendation
    type: Number,
    default: 0
  },
  source: { // Optional: Information on how this recommendation was generated
    type: String,
    trim: true
  },
  // generatedAt handled automatically by timestamps: true
}, {
  timestamps: { createdAt: 'generatedAt', updatedAt: false } // Rename createdAt, disable updatedAt
});

// Optional: TTL index to automatically remove old recommendations after a certain time
// RecommendationSchema.index({ generatedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 7 }); // Expires after 7 days

// Optional: Compound index for uniqueness or specific query patterns
// RecommendationSchema.index({ user: 1, recommendedMovie: 1 }, { unique: true });

const Recommendation = mongoose.model('Recommendation', RecommendationSchema);

module.exports = Recommendation;