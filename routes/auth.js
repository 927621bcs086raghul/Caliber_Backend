const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'changeme-secret-key';

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: User authentication
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             example:
 *               id: 1
 *               name: "Test User"
 *               email: "test@example.com"
 *       400:
 *         description: User already exists
 *         content:
 *           application/json:
 *             example:
 *               message: "User already exists"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             example:
 *               message: "Server error"
 *               error: "Error details"
 */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({ name, email, password });

    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful, sets HttpOnly JWT cookie and returns user info
 *         content:
 *           application/json:
 *             example:
 *               user:
 *                 id: 1
 *                 name: "Test User"
 *                 email: "test@example.com"
 *                 phone: "1234567890"
 *                 location: "Chennai"
 *       400:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             example:
 *               message: "Invalid credentials"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             example:
 *               message: "Server error"
 *               error: "Error details"
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id }, JWT_SECRET, {
      expiresIn: '7d',
    });

    const cookieOptions = {
      httpOnly: true,
      sameSite: 'lax',
    };

    if (process.env.NODE_ENV === 'production') {
      cookieOptions.secure = true;
      cookieOptions.sameSite = 'strict';
    }

    res
      .cookie('token', token, cookieOptions)
      .json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          location: user.location,
        },
      });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout the current user
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logged out successfully
 *         content:
 *           application/json:
 *             example:
 *               message: "Logged out successfully"
 */
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
});

/**
 * @swagger
 * /api/auth/check:
 *   get:
 *     summary: Check authentication status using HttpOnly JWT cookie
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Authentication status
 *         content:
 *           application/json:
 *             example:
 *               authenticated: true
 *               userId: 1
 */
router.get('/check', protect, (req, res) => {
  // If protect passed, token is valid and req.user is set
  res.json({ authenticated: true, userId: req.user.id });
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current authenticated user's profile
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: User profile
 *         content:
 *           application/json:
 *             example:
 *               id: 1
 *               name: "Test User"
 *               email: "test@example.com"
 *               phone: "1234567890"
 *               location: "Chennai"
 *               createdAt: "2025-12-13T10:00:00.000Z"
 *               updatedAt: "2025-12-13T10:10:00.000Z"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             example:
 *               message: "Not authorized, no token"
 */
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'name', 'email', 'phone', 'location', 'createdAt', 'updatedAt'],
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * @swagger
 * /api/auth/me/{id}:
 *   get:
 *     summary: Get a user's profile by ID
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the user
 *     responses:
 *       200:
 *         description: User profile
 *         content:
 *           application/json:
 *             example:
 *               id: 2
 *               name: "Other User"
 *               email: "other@example.com"
 *               phone: "1234567890"
 *               location: "Chennai"
 *               createdAt: "2025-12-13T10:00:00.000Z"
 *               updatedAt: "2025-12-13T10:10:00.000Z"
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             example:
 *               message: "User not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             example:
 *               message: "Server error"
 *               error: "Error details"
 */
router.get('/me/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: ['id', 'name', 'email', 'phone', 'location', 'createdAt', 'updatedAt'],
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * @swagger
 * /api/auth/profile:
 *   patch:
 *     summary: Partially update current authenticated user's profile
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               location:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated user profile
 *         content:
 *           application/json:
 *             example:
 *               id: 1
 *               name: "Updated User"
 *               email: "updated@example.com"
 *               phone: "9999999999"
 *               location: "New City"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             example:
 *               message: "Not authorized, no token"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             example:
 *               message: "Server error"
 *               error: "Error details"
 */
router.patch('/profile', protect, async (req, res) => {
  try {
    const { name, email, phone, location } = req.body;

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (phone !== undefined) user.phone = phone;
    if (location !== undefined) user.location = location;

    await user.save();

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      location: user.location,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
