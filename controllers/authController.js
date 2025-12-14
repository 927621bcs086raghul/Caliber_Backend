const authService = require('../services/authService');
const config = require('../config/env');

class AuthController {
  /**
   * Register a new user
   * @route POST /api/auth/register
   */
  async register(req, res) {
    try {
      const { name, email, password } = req.body;

      const user = await authService.register({ name, email, password });

      res.status(201).json(user);
    } catch (error) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({ 
        message: error.message || 'Server error',
        ...(process.env.NODE_ENV === 'development' && { error: error.stack })
      });
    }
  }

  /**
   * Login a user
   * @route POST /api/auth/login
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;

      const result = await authService.login({ email, password });
      const cookieOptions = {
        httpOnly: true,
        sameSite: config.server.isProduction ? 'strict' : 'lax',
        secure: config.server.isProduction,
      };

      res
        .cookie(config.jwt.cookieName, result.token, cookieOptions)
        .json({ user: result.user });
    } catch (error) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({ 
        message: error.message || 'Server error',
        ...(process.env.NODE_ENV === 'development' && { error: error.stack })
      });
    }
  }

  /**
   * Logout a user
   * @route POST /api/auth/logout
   */
  async logout(req, res) {
    try {
      res.clearCookie(config.jwt.cookieName);
      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }

  /**
   * Check authentication status
   * @route GET /api/auth/check
   */
  async checkAuth(req, res) {
    try {
      res.json({ 
        authenticated: true, 
        userId: req.user.id 
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }

  /**
   * Get current user profile
   * @route GET /api/auth/me
   */
  async getCurrentUser(req, res) {
    try {
      const user = await authService.getUserProfile(req.user.id);
      res.json(user);
    } catch (error) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({ 
        message: error.message || 'Server error',
        ...(process.env.NODE_ENV === 'development' && { error: error.stack })
      });
    }
  }

  /**
   * Get user profile by ID
   * @route GET /api/auth/me/:id
   */
  async getUserById(req, res) {
    try {
      const { id } = req.params;
      const user = await authService.getUserProfile(parseInt(id));
      res.json(user);
    } catch (error) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({ 
        message: error.message || 'Server error',
        ...(process.env.NODE_ENV === 'development' && { error: error.stack })
      });
    }
  }

  /**
   * Update user profile
   * @route PATCH /api/auth/profile
   */
  async updateProfile(req, res) {
    try {
      const { name, email, phone, location } = req.body;
      
      const updatedUser = await authService.updateUserProfile(req.user.id, {
        name,
        email,
        phone,
        location,
      });

      res.json(updatedUser);
    } catch (error) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({ 
        message: error.message || 'Server error',
        ...(process.env.NODE_ENV === 'development' && { error: error.stack })
      });
    }
  }
}

module.exports = new AuthController();