const mongoose = require('mongoose');

const connectDB = async () => {
  // Ensure MONGODB_URI is loaded
  const dbUri = process.env.MONGODB_URI;
  if (!dbUri) {
    console.error('FATAL ERROR: MONGODB_URI environment variable is not set.');
    process.exit(1);
  }
  
  console.log(`Attempting to connect to MongoDB at: ${dbUri.substring(0, dbUri.indexOf('@') > 0 ? dbUri.indexOf('@') : dbUri.length)}...`); // Log URI without credentials

  try {
    // Use the MONGODB_URI from environment variables
    const conn = await mongoose.connect(dbUri, {
      serverSelectionTimeoutMS: 5000 // Timeout after 5s instead of default 30s
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('\n--- MongoDB Connection Error --- ');
    console.error(`Failed to connect to MongoDB.`);
    console.error(`URI Used (credentials hidden): ${dbUri.substring(0, dbUri.indexOf('@') > 0 ? dbUri.indexOf('@') : dbUri.length)}...`);
    
    // Check for specific error types
    if (error.name === 'MongoNetworkError' || error.message.includes('connect ETIMEDOUT') || error.message.includes('server selection timed out')) {
        console.error('Reason: Could not reach the MongoDB server. This is often due to:');
        console.error('  1. Incorrect hostname or port in the connection string.');
        console.error('  2. Firewall blocking the connection (Check Atlas IP Access List: https://www.mongodb.com/docs/atlas/security-whitelist/).');
        console.error('  3. Network issues between your server and MongoDB Atlas.');
    } else if (error.name === 'MongoServerError' && error.message.includes('authentication failed')) {
        console.error('Reason: Authentication failed. Check the username and password in your MONGODB_URI.');
    } else {
        // General error
        console.error('Reason:', error.message);
    }
    console.error('Full Error:', error); // Log the full error object
    console.error('------------------------------\n');
    // Exit process with failure code
    process.exit(1);
  }
};

module.exports = connectDB;