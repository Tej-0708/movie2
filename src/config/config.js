module.exports = {
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key-here',
    jwtExpiration: '24h'
}; 