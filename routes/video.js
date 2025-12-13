const express = require('express');
const multer = require('multer');
const path = require('path');
const Video = require('../models/video');
const User = require('../models/user');
const fs = require('fs');
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
    *         content:
    *           application/json:
    *             example:
    *               id: 1
    *               filename: "video.mp4"
    *               filepath: "/uploads/1734080000000-video.mp4"
    *               filesize: 1234567
    *               title: "Demo Video"
    *               description: "Sample description"
    *               thumbnailPath: "/uploads/1734080000001-thumb.jpg"
    *               user_id: 1
    *       400:
    *         description: No file uploaded
    *         content:
    *           application/json:
    *             example:
    *               message: "No video file uploaded"
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
    *         content:
    *           application/json:
    *             example:
    *               - id: 1
    *                 filename: "video.mp4"
    *                 filepath: "/uploads/1734080000000-video.mp4"
    *                 filesize: 1234567
    *                 title: "Demo Video"
    *                 description: "Sample description"
    *                 thumbnailPath: "/uploads/1734080000001-thumb.jpg"
    *                 user_id: 1
    *       500:
    *         description: Server error
    *         content:
    *           application/json:
    *             example:
    *               message: "Server error"
    *               error: "Error details"
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

  /**
   * @swagger
   * /api/videos/user/{userId}:
   *   get:
   *     summary: Get videos created by a specific user
   *     tags: [Videos]
   *     parameters:
   *       - in: path
   *         name: userId
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID of the user
   *     responses:
    *       200:
    *         description: List of videos created by the user
    *         content:
    *           application/json:
    *             example:
    *               - id: 1
    *                 filename: "video.mp4"
    *                 filepath: "/uploads/1734080000000-video.mp4"
    *                 filesize: 1234567
    *                 title: "User Video"
    *                 description: "Uploaded by this user"
    *                 thumbnailPath: "/uploads/1734080000001-thumb.jpg"
    *                 user_id: 5
    *       500:
    *         description: Server error
    *         content:
    *           application/json:
    *             example:
    *               message: "Server error"
    *               error: "Error details"
   */
  router.get('/user/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      console.log(req);

      const videos = await Video.findAll({
        where: { user_id: userId },
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

  /**
   * @swagger
   * /api/videos/:videoId:
   *   get:
   *     summary: Get videos created by a specific user
   *     tags: [Videos]
   *     parameters:
   *       - in: path
   *         name: userId
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID of the user
   *     responses:
    *       200:
    *         description: List of videos created by the user
    *         content:
    *           application/json:
    *             example:
    *               - id: 1
    *                 filename: "video.mp4"
    *                 filepath: "/uploads/1734080000000-video.mp4"
    *                 filesize: 1234567
    *                 title: "User Video"
    *                 description: "Uploaded by this user"
    *                 thumbnailPath: "/uploads/1734080000001-thumb.jpg"
    *                 user_id: 5
    *       500:
    *         description: Server error
    *         content:
    *           application/json:
    *             example:
    *               message: "Server error"
    *               error: "Error details"
   */

  router.get('/:videoId', async (req, res) => {
    try {
      const { videoId } = req.params;
  
      const video = await Video.findByPk(videoId, {
        include: {
          model: User,
          attributes: ['id', 'name', 'email'],
        },
      });
  
      if (!video) {
        return res.status(404).json({ message: 'Video not found' });
      }
  
      res.json(video);
    } catch (err) {
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  });
  


  router.get('/stream/:videoId', async (req, res) => {
    try {
      const { videoId } = req.params;
  
      const video = await Video.findByPk(videoId);
      if (!video) return res.status(404).send('Video not found');
  
      const videoPath = path.join(__dirname, '..', video.filepath);
      const stat = fs.statSync(videoPath);
      const fileSize = stat.size;
  
      const range = req.headers.range;
      if (!range) {
        return res.status(416).send('Range header required');
      }
  
      const CHUNK_SIZE = 10 ** 6; // 1MB
      const start = Number(range.replace(/\D/g, ''));
      const end = Math.min(start + CHUNK_SIZE, fileSize - 1);
  
      const contentLength = end - start + 1;
  
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': contentLength,
        'Content-Type': 'video/mp4',
      });
  
      const stream = fs.createReadStream(videoPath, { start, end });
      stream.pipe(res);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  

  return router;
};

module.exports = createVideoRouter;
