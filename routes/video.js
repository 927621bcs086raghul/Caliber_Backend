const express = require('express');
const multer = require('multer');
const path = require('path');
const videoController = require('../controllers/videoController');
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
  *               categories:
  *                 type: array
  *                 items:
  *                   type: string
  *                 description: Array of category names to associate with the video, e.g. ["Education", "React", "Programming"]
  *               video:
  *                 type: string
  *                 format: binary
  *               thumbnail:
  *                 type: string
  *                 format: binary
  *               draft:
  *                 type: boolean
  *                 description: Whether the video is a draft (default false)
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
  *               categories:
  *                 - React
  *                 - Games
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
  router.post(
    '/',
    protect,
    upload.fields([
      { name: 'video', maxCount: 1 },
      { name: 'thumbnail', maxCount: 1 },
    ]),
    (req, res) => videoController.uploadVideo(req, res, io)
  );

  /**
   * @swagger
   * /api/videos/categories:
   *   get:
   *     summary: Get all distinct video categories
   *     tags: [Videos]
   *     responses:
   *       200:
   *         description: List of category names
   *         content:
   *           application/json:
   *             example:
   *               - Education
   *               - React
   *               - Programming
   *       500:
   *         description: Server error
   *         content:
   *           application/json:
   *             example:
   *               message: "Server error"
   *               error: "Error details"
   */
  router.get('/categories', (req, res) => videoController.getCategories(req, res));

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
  *                 categories:
  *                   - React
  *                   - Games
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
  router.get('/', (req, res) => videoController.getAllVideos(req, res));

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
  *                 categories:
  *                   - React
  *                   - Games
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
  router.get('/user/:userId', (req, res) => videoController.getVideosByUserId(req, res));

  /**
   * @swagger
   * /api/videos/stream/{videoId}:
   *   get:
   *     summary: Stream a video by ID
   *     tags: [Videos]
   *     parameters:
   *       - in: path
   *         name: videoId
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID of the video to stream
   *     responses:
   *       206:
   *         description: Partial video content
   *       404:
   *         description: Video not found
   *         content:
   *           application/json:
   *             example:
   *               error: "Video not found"
   *       416:
   *         description: Range header required
   *         content:
   *           text/plain:
   *             example: "Range header required"
   *       500:
   *         description: Server error
   *         content:
   *           application/json:
   *             example:
   *               error: "Error details"
   */
  router.get('/stream/:videoId', (req, res) => videoController.streamVideo(req, res));

  /**
   * @swagger
   * /api/videos/{videoId}:
   *   get:
   *     summary: Get a single video by ID
   *     tags: [Videos]
   *     parameters:
   *       - in: path
   *         name: videoId
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID of the video
   *     responses:
   *       200:
   *         description: Video details
   *         content:
   *           application/json:
   *             example:
   *               id: 1
   *               filename: "video.mp4"
   *               filepath: "/uploads/1734080000000-video.mp4"
   *               filesize: 1234567
   *               title: "Demo Video"
   *               description: "Sample description"
  *               categories:
  *                 - React
  *                 - Games
   *               thumbnailPath: "/uploads/1734080000001-thumb.jpg"
   *               user_id: 1
   *       404:
   *         description: Video not found
   *         content:
   *           application/json:
   *             example:
   *               message: "Video not found"
   *       500:
   *         description: Server error
   *         content:
   *           application/json:
   *             example:
   *               message: "Server error"
   *               error: "Error details"
   */
  router.get('/:videoId', (req, res) => videoController.getVideoById(req, res));

  /**
   * @swagger
   * /api/videos/{videoId}:
   *   patch:
   *     summary: Update a video
   *     tags: [Videos]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: videoId
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID of the video
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               title:
   *                 type: string
   *               description:
   *                 type: string
   *     responses:
   *       200:
   *         description: Video updated successfully
   *       403:
   *         description: Not authorized to update this video
   *       404:
   *         description: Video not found
   */
  router.patch('/:videoId', protect, (req, res) => videoController.updateVideo(req, res));

  /**
   * @swagger
   * /api/videos/{videoId}:
   *   delete:
   *     summary: Delete a video
   *     tags: [Videos]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: videoId
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID of the video
   *     responses:
   *       200:
   *         description: Video deleted successfully
   *       403:
   *         description: Not authorized to delete this video
   *       404:
   *         description: Video not found
   */
  router.delete('/:videoId', protect, (req, res) => videoController.deleteVideo(req, res));

  return router;
};

module.exports = createVideoRouter;