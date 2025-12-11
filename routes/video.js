const express = require('express');
const multer = require('multer');
const path = require('path');
const Video = require('../models/video');
const User = require('../models/user');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Multer storage config
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// Upload video
router.post('/', protect, upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { originalname, filename, size } = req.file;

    const video = await Video.create({
      filename: originalname,
      filepath: `/uploads/${filename}`,
      filesize: size,
      user_id: req.user.id,
    });

    res.status(201).json(video);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get all videos
router.get('/', async (req, res) => {
  try {
    const videos = await Video.findAll({
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email'],
        },
      ],
    });
    res.json(videos);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
