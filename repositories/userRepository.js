const User = require('../models/user');

class UserRepository {
  /**
   * Find a user by email
   * @param {string} email - User email
   * @returns {Promise<User|null>}
   */
  async findByEmail(email) {
    return await User.findOne({ where: { email } });
  }

  /**
   * Find a user by ID
   * @param {number} id - User ID
   * @returns {Promise<User|null>}
   */
  async findById(id) {
    return await User.findByPk(id);
  }

  /**
   * Find a user by ID with specific attributes
   * @param {number} id - User ID
   * @param {Array<string>} attributes - Attributes to return
   * @returns {Promise<User|null>}
   */
  async findByIdWithAttributes(id, attributes) {
    return await User.findByPk(id, { attributes });
  }

  /**
   * Create a new user
   * @param {Object} userData - User data
   * @param {string} userData.name - User name
   * @param {string} userData.email - User email
   * @param {string} userData.password - User password
   * @returns {Promise<User>}
   */
  async create(userData) {
    return await User.create(userData);
  }

  /**
   * Update a user
   * @param {User} user - User instance to update
   * @param {Object} updates - Fields to update
   * @returns {Promise<User>}
   */
  async update(user, updates) {
    Object.assign(user, updates);
    return await user.save();
  }

  /**
   * Delete a user
   * @param {number} id - User ID
   * @returns {Promise<number>} Number of rows deleted
   */
  async delete(id) {
    return await User.destroy({ where: { id } });
  }

  /**
   * Find all users
   * @returns {Promise<Array<User>>}
   */
  async findAll() {
    return await User.findAll();
  }
}

module.exports = new UserRepository();