const videoService = require('../services/videoService');
const fs = require('fs');

class VideoController {
  /**
   * Upload a new video
   * @route POST /api/videos
   */
  async uploadVideo(req, res, io) {
    try {
      const { title, description,isDraft, categories } = req.body;

      const video = await videoService.uploadVideo({
        files: req.files,
        title,
        description,
        isDraft,
        userId: req.user.id,
        categories,
      });

      if (io) {
        io.to('dashboard').emit('videoUploaded', {
          id: video.id,
          filename: video.filename,
          filepath: video.filepath,
          filesize: video.filesize,
          title: video.title,
          description: video.description,
          categories: video.categories || (Array.isArray(categories) ? categories : []),
          thumbnailPath: video.thumbnailPath,
          user_id: video.user_id,
          createdAt: video.createdAt,
        });
      }

      res.status(201).json(video);
    } catch (error) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({ 
        message: error.message || 'Server error',
        ...(process.env.NODE_ENV === 'development' && { error: error.stack })
      });
    }
  }

  /**
   * Get all videos
   * @route GET /api/videos
   */
  async getAllVideos(req, res) {
    try {
      const videos = await videoService.getAllVideos();
      res.json(videos);
    } catch (error) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({ 
        message: error.message || 'Server error',
        ...(process.env.NODE_ENV === 'development' && { error: error.stack })
      });
    }
  }

  /**
   * Get all distinct video categories
   * @route GET /api/videos/categories
   */
  async getCategories(req, res) {
    try {
      const categories = await videoService.getAllCategories();
      res.json(categories);
    } catch (error) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        message: error.message || 'Server error',
        ...(process.env.NODE_ENV === 'development' && { error: error.stack }),
      });
    }
  }

  /**
   * Get videos by user ID
   * @route GET /api/videos/user/:userId
   */
  async getVideosByUserId(req, res) {
    try {
      const { userId } = req.params;
      const videos = await videoService.getVideosByUserId(parseInt(userId));
      res.json(videos);
    } catch (error) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({ 
        message: error.message || 'Server error',
        ...(process.env.NODE_ENV === 'development' && { error: error.stack })
      });
    }
  }

  /**
   * Get a single video by ID
   * @route GET /api/videos/:videoId
   */
  async getVideoById(req, res) {
    try {
      const { videoId } = req.params;
      const video = await videoService.getVideoById(parseInt(videoId));
      res.json(video);
    } catch (error) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        message: error.message || 'Server error',
        ...(process.env.NODE_ENV === 'development' && { error: error.stack })
      });
    }
  }

  /**
   * Stream a video by ID
   * @route GET /api/videos/stream/:videoId
   */
  async streamVideo(req, res) {
    try {
      const { videoId } = req.params;
      const { videoPath, fileSize } = await videoService.getVideoForStreaming(parseInt(videoId));

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
    } catch (error) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({ 
        message: error.message || 'Server error',
        ...(process.env.NODE_ENV === 'development' && { error: error.stack })
      });
    }
  }

  /**
   * Update a video
   * @route PATCH /api/videos/:videoId
   */
  async updateVideo(req, res) {
    try {
      const { videoId } = req.params;
      const { title, description } = req.body;

      const updatedVideo = await videoService.updateVideo(
        parseInt(videoId),
        { title, description },
        req.user.id
      );

      res.json(updatedVideo);
    } catch (error) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({ 
        message: error.message || 'Server error',
        ...(process.env.NODE_ENV === 'development' && { error: error.stack })
      });
    }
  }

  /**
   * Delete a video
   * @route DELETE /api/videos/:videoId
   */
  async deleteVideo(req, res) {
    try {
      const { videoId } = req.params;
      
      const result = await videoService.deleteVideo(
        parseInt(videoId),
        req.user.id
      );

      res.json(result);
    } catch (error) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({ 
        message: error.message || 'Server error',
        ...(process.env.NODE_ENV === 'development' && { error: error.stack })
      });
    }
  }

  /**
   * Get paginated videos
   * @route GET /api/videos/paginated
   */
  async getPaginatedVideos(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      const result = await videoService.getPaginatedVideos(page, limit);
      res.json(result);
    } catch (error) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({ 
        message: error.message || 'Server error',
        ...(process.env.NODE_ENV === 'development' && { error: error.stack })
      });
    }
  }
}

module.exports = new VideoController();