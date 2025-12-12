const express = require('express');
const multer = require('multer');
const path = require('path');
const Video = require('../models/video');
const User = require('../models/user');
const { protect } = require('../middleware/authMiddleware');

const createVideoRouter = (io) => {
  const router = express.Router();

  /**
   * @swagger
   * tags:
   *   name: Videos
   *   description: Video upload and listing
   */

  // Multer storage config - same folder for videos and thumbnails
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

  /**
   * @swagger
   * /api/videos:
   *   post:
   *     summary: Upload a new video
   *     tags: [Videos]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
  *           schema:
  *             type: object
  *             properties:
  *               title:
  *                 type: string
  *               description:
  *                 type: string
  *               video:
  *                 type: string
  *                 format: binary
  *               thumbnail:
  *                 type: string
  *                 format: binary
   *     responses:
   *       201:
   *         description: Video uploaded successfully
   *       400:
   *         description: No file uploaded
   *       401:
   *         description: Unauthorized
   *       500:
   *         description: Server error
   */
  // Upload video with thumbnail
  router.post(
    '/',
    protect,
    upload.fields([
      { name: 'video', maxCount: 1 },
      { name: 'thumbnail', maxCount: 1 },
    ]),
    async (req, res) => {
    try {
      const videoFile = req.files && req.files.video ? req.files.video[0] : null;
      const thumbnailFile =
        req.files && req.files.thumbnail ? req.files.thumbnail[0] : null;

      if (!videoFile) {
        return res.status(400).json({ message: 'No video file uploaded' });
      }

      const { title, description } = req.body;

      if (!title) {
        return res.status(400).json({ message: 'Title is required' });
      }

      const video = await Video.create({
        filename: videoFile.originalname,
        filepath: `/uploads/${videoFile.filename}`,
        filesize: videoFile.size,
        title,
        description,
        thumbnailPath: thumbnailFile
          ? `/uploads/${thumbnailFile.filename}`
          : null,
        user_id: req.user.id,
      });

      // Emit real-time event to a room (e.g., 'dashboard')
      if (io) {
        io.to('dashboard').emit('videoUploaded', {
          id: video.id,
          filename: video.filename,
          filepath: video.filepath,
          filesize: video.filesize,
          title: video.title,
          description: video.description,
          thumbnailPath: video.thumbnailPath,
          user_id: video.user_id,
          createdAt: video.createdAt,
        });
      }

      res.status(201).json(video);
    } catch (err) {
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  });

  /**
   * @swagger
   * /api/videos:
   *   get:
   *     summary: Get all videos
   *     tags: [Videos]
   *     responses:
   *       200:
   *         description: List of videos
   *       500:
   *         description: Server error
   */
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

  return router;
};

module.exports = createVideoRouter;
