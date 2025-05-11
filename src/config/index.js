// Central place for configuration constants loaded from .env
module.exports = {
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1y', // Default expiration
    tmdbApiKey: process.env.TMDB_API_KEY,
    tmdbBaseUrl: process.env.TMDB_BASE_URL,
    // Add other configurations if needed
  };