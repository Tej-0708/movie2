const bcrypt = require('bcrypt');
const saltRounds = 10; // Adjust cost factor as needed

/**
 * Hashes a plain text password.
 * @param {string} plainPassword - The password to hash.
 * @returns {Promise<string>} - The hashed password.
 * @throws {Error} - If hashing fails.
 */
const hashPassword = async (plainPassword) => {
  try {
    // Generate salt and hash in one step for efficiency
    const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);
    return hashedPassword;
  } catch (error) {
    console.error("Error hashing password:", error);
    // Re-throw a more specific error or handle as needed
    throw new Error('Password hashing failed');
  }
};

/**
 * Compares a plain text password with a stored hash.
 * @param {string} plainPassword - The submitted password.
 * @param {string} hashedPassword - The stored hash from the database.
 * @returns {Promise<boolean>} - True if passwords match, false otherwise.
 */
const comparePassword = async (plainPassword, hashedPassword) => {
  try {
    const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
    return isMatch;
  } catch (error) {
    // Log error but return false for security (don't reveal hashing issues)
    console.error("Error comparing password:", error);
    return false;
  }
};

module.exports = {
  hashPassword,
  comparePassword,
};