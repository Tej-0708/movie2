const jwt = require('jsonwebtoken');
const config = require('../config'); // Load JWT secret from central config

// Use secret from config or fallback
const secretKey = config.jwtSecret || '9fa0d8b2f4a8407f9a86eac3e3b5f8e7d74c9321f82392e0';

/**
 * Middleware to verify JWT token from Authorization header.
 * Attaches decoded user payload (e.g., userId) to req.user if valid.
 */
const verifyToken = (req, res, next) => {
  // Get token from 'Authorization: Bearer <token>' header
  const authHeader = req.headers.authorization || req.headers.Authorization;

  // Check if Authorization header exists and starts with 'Bearer '
  if (!authHeader?.startsWith('Bearer ')) {
    console.log("Auth Middleware: No Bearer token provided.");
    // 401 Unauthorized - No token
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  // Extract token part
  const token = authHeader.split(' ')[1];

  if (!token) {
    console.log("Auth Middleware: Token missing after Bearer split.");
     // Should not happen if startsWith('Bearer ') is true, but defensive check
    return res.status(401).json({ message: 'Access denied. Token format invalid.' });
  }

  try {
    // Verify the token using the secret key
    const decoded = jwt.verify(token, secretKey);

    // Attach user information from token payload to the request object
    // Ensure your JWT payload contains the necessary user identifier (e.g., userId)
    req.user = {
        userId: decoded.userId, // Assuming payload has userId
        username: decoded.username // Optional: include username if in payload
        // Add other payload fields as needed
    };

    console.log(`Auth Middleware: Token verified for user ${decoded.userId}`);
    next(); // Token is valid, proceed to the next middleware or route handler

  } catch (error) {
    console.error("Auth Middleware: JWT Verification Error:", error.name, error.message);

    // Handle specific JWT errors
    if (error.name === 'TokenExpiredError') {
       return res.status(401).json({ message: 'Access denied. Token has expired.' });
    }
    if (error.name === 'JsonWebTokenError') {
       return res.status(403).json({ message: 'Access denied. Invalid token.' }); // 403 Forbidden for invalid token
    }
    // Handle other potential errors during verification
    return res.status(500).json({ message: 'Failed to authenticate token.' });
  }
};

module.exports = { verifyToken };