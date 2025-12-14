const videoRepository = require('../repositories/videoRepository');
const path = require('path');
const fs = require('fs');

class VideoService {
  /**
   * Upload a new video
   * @param {Object} videoData - Video upload data
   * @param {Object} videoData.files - Uploaded files
   * @param {string} videoData.title - Video title
   * @param {string} videoData.description - Video description
   * @param {number} videoData.userId - User ID of uploader
   * @returns {Promise<Object>} Created video data
   * @throws {Error} If video file is missing or validation fails
   */
  async uploadVideo(videoData) {
    const { files, title, description, userId } = videoData;

    const videoFile = files && files.video ? files.video[0] : null;
    if (!videoFile) {
      const error = new Error('No video file uploaded');
      error.statusCode = 400;
      throw error;
    }

    if (!title) {
      const error = new Error('Title is required');
      error.statusCode = 400;
      throw error;
    }

    const thumbnailFile = files && files.thumbnail ? files.thumbnail[0] : null;

    const video = await videoRepository.create({
      filename: videoFile.originalname,
      filepath: `/uploads/${videoFile.filename}`,
      filesize: videoFile.size,
      title,
      description,
      thumbnailPath: thumbnailFile ? `/uploads/${thumbnailFile.filename}` : null,
      user_id: userId,
    });

    return video;
  }

  /**
   * Get all videos
   * @returns {Promise<Array<Object>>} List of all videos
   */
  async getAllVideos() {
    return await videoRepository.findAll();
  }

  /**
   * Get videos by user ID
   * @param {number} userId - User ID
   * @returns {Promise<Array<Object>>} List of user's videos
   */
  async getVideosByUserId(userId) {
    return await videoRepository.findByUserId(userId);
  }

  /**
   * Get a single video by ID
   * @param {number} videoId - Video ID
   * @returns {Promise<Object>} Video data
   * @throws {Error} If video not found
   */
  async getVideoById(videoId) {
    const video = await videoRepository.findById(videoId);
    
    if (!video) {
      const error = new Error('Video not found');
      error.statusCode = 404;
      throw error;
    }

    return video;
  }

  /**
   * Get video file path for streaming
   * @param {number} videoId - Video ID
   * @returns {Promise<Object>} Video file information
   * @throws {Error} If video not found
   */
  async getVideoForStreaming(videoId) {
    const video = await videoRepository.findById(videoId);
    
    if (!video) {
      const error = new Error('Video not found');
      error.statusCode = 404;
      throw error;
    }

    const videoPath = path.join(__dirname, '..', video.filepath);
    
    if (!fs.existsSync(videoPath)) {
      const error = new Error('Video file not found on server');
      error.statusCode = 404;
      throw error;
    }

    const stat = fs.statSync(videoPath);
    
    return {
      videoPath,
      fileSize: stat.size,
      video,
    };
  }

  /**
   * Update video information
   * @param {number} videoId - Video ID
   * @param {Object} updates - Video updates
   * @param {string} [updates.title] - Updated title
   * @param {string} [updates.description] - Updated description
   * @param {number} userId - User ID (for authorization check)
   * @returns {Promise<Object>} Updated video data
   * @throws {Error} If video not found or user not authorized
   */
  async updateVideo(videoId, updates, userId) {
    const video = await videoRepository.findById(videoId);
    
    if (!video) {
      const error = new Error('Video not found');
      error.statusCode = 404;
      throw error;
    }

    if (video.user_id !== userId) {
      const error = new Error('Not authorized to update this video');
      error.statusCode = 403;
      throw error;
    }

    const allowedUpdates = {};
    if (updates.title !== undefined) allowedUpdates.title = updates.title;
    if (updates.description !== undefined) allowedUpdates.description = updates.description;

    await videoRepository.update(video, allowedUpdates);

    return video;
  }

  /**
   * Delete a video
   * @param {number} videoId - Video ID
   * @param {number} userId - User ID (for authorization check)
   * @returns {Promise<Object>} Deletion result
   * @throws {Error} If video not found or user not authorized
   */
  async deleteVideo(videoId, userId) {
    const video = await videoRepository.findById(videoId);
    
    if (!video) {
      const error = new Error('Video not found');
      error.statusCode = 404;
      throw error;
    }

    if (video.user_id !== userId) {
      const error = new Error('Not authorized to delete this video');
      error.statusCode = 403;
      throw error;
    }

    const videoPath = path.join(__dirname, '..', video.filepath);
    if (fs.existsSync(videoPath)) {
      fs.unlinkSync(videoPath);
    }

    if (video.thumbnailPath) {
      const thumbnailPath = path.join(__dirname, '..', video.thumbnailPath);
      if (fs.existsSync(thumbnailPath)) {
        fs.unlinkSync(thumbnailPath);
      }
    }

    await videoRepository.delete(videoId);

    return { message: 'Video deleted successfully' };
  }

  /**
   * Get paginated videos
   * @param {number} page - Page number (starting from 1)
   * @param {number} limit - Number of videos per page
   * @returns {Promise<Object>} Paginated video list
   */
  async getPaginatedVideos(page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const videos = await videoRepository.findWithPagination(limit, offset);
    const totalVideos = await videoRepository.count();
    const totalPages = Math.ceil(totalVideos / limit);

    return {
      videos,
      pagination: {
        currentPage: page,
        totalPages,
        totalVideos,
        limit,
      },
    };
  }
}

module.exports = new VideoService();