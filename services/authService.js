const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository');
const config = require('../config/env');

class AuthService {
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @param {string} userData.name - User name
   * @param {string} userData.email - User email
   * @param {string} userData.password - User password
   * @returns {Promise<Object>} Created user data (without password)
   * @throws {Error} If user already exists
   */
  async register(userData) {
    const { name, email, password } = userData;

    // Check if user already exists
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      const error = new Error('User already exists');
      error.statusCode = 400;
      throw error;
    }

    // Create new user
    const user = await userRepository.create({ name, email, password });

    // Return user without password
    return {
      id: user.id,
      name: user.name,
      email: user.email,
    };
  }

  /**
   * Login a user
   * @param {Object} credentials - User login credentials
   * @param {string} credentials.email - User email
   * @param {string} credentials.password - User password
   * @returns {Promise<Object>} User data and JWT token
   * @throws {Error} If credentials are invalid
   */
  async login(credentials) {
    const { email, password } = credentials;

    const user = await userRepository.findByEmail(email);
    if (!user) {
      const error = new Error('Invalid credentials');
      error.statusCode = 400;
      throw error;
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      const error = new Error('Invalid credentials');
      error.statusCode = 400;
      throw error;
    }

    const token = jwt.sign({ id: user.id }, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        location: user.location,
      },
    };
  }

  /**
   * Get user profile by ID
   * @param {number} userId - User ID
   * @returns {Promise<Object>} User profile data
   * @throws {Error} If user not found
   */
  async getUserProfile(userId) {
    const user = await userRepository.findByIdWithAttributes(userId, [
      'id',
      'name',
      'email',
      'phone',
      'location',
      'createdAt',
      'updatedAt',
    ]);

    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    return user;
  }

  /**
   * Update user profile
   * @param {number} userId - User ID
   * @param {Object} updates - Profile updates
   * @param {string} [updates.name] - Updated name
   * @param {string} [updates.email] - Updated email
   * @param {string} [updates.phone] - Updated phone
   * @param {string} [updates.location] - Updated location
   * @returns {Promise<Object>} Updated user data
   * @throws {Error} If user not found
   */
  async updateUserProfile(userId, updates) {
    const user = await userRepository.findById(userId);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    const allowedUpdates = {};
    if (updates.name !== undefined) allowedUpdates.name = updates.name;
    if (updates.email !== undefined) allowedUpdates.email = updates.email;
    if (updates.phone !== undefined) allowedUpdates.phone = updates.phone;
    if (updates.location !== undefined) allowedUpdates.location = updates.location;

    await userRepository.update(user, allowedUpdates);

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      location: user.location,
    };
  }

  /**
   * Verify authentication token
   * @param {string} token - JWT token
   * @returns {Promise<Object>} Decoded token data
   * @throws {Error} If token is invalid
   */
  async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      return decoded;
    } catch (error) {
      const err = new Error('Invalid token');
      err.statusCode = 401;
      throw err;
    }
  }

  /**
   * Get user by ID (for authentication middleware)
   * @param {number} userId - User ID
   * @returns {Promise<Object>} User data
   * @throws {Error} If user not found
   */
  async getUserById(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }
    return user;
  }
}

module.exports = new AuthService();