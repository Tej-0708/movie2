const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create indexes
userSchema.index({ username: 1 });

// Disable automatic hashing via pre-save hook to allow explicit control in controller

// --- Mongoose Instance Methods ---

// Add a method to User documents to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    console.error("Error in comparePassword instance method:", error);
    return false;
  }
};

// --- Create and Export Model ---
// Mongoose compiles the schema into a model, providing an interface to the 'users' collection
const User = mongoose.model('User', userSchema); // Conventionally uses singular name, Mongoose creates plural collection name ('users')

module.exports = User;