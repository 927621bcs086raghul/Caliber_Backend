const videoRepository = require('../repositories/videoRepository');
const VideoCategory = require('../models/videoCategory');
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
    const { files, title, description, userId, isDraft, categories } = videoData;

    // Normalize categories: accept array, JSON string, or single comma-separated string
    console.log('Categories input:', categories);
    let categoryList = [];
    if (Array.isArray(categories)) {
      categoryList = categories;
    } else if (typeof categories === 'string') {
      const trimmed = categories.trim();
      if (trimmed) {
        // Try JSON array first (e.g. "[\"React\",\"Games\"]"), then fall back to comma-separated
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) {
            categoryList = parsed;
          } else {
            categoryList = [trimmed];
          }
        } catch {
          categoryList = trimmed
            .split(',')
            .map((c) => c.trim())
            .filter(Boolean);
        }
      }
    }
  

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
      categories: categoryList.length > 0 ? categoryList : null,
      thumbnailPath: thumbnailFile ? `/uploads/${thumbnailFile.filename}` : null,
      user_id: userId,
      draft:isDraft
    });

    if (categoryList.length > 0) {
      const rows = categoryList.map((catName) => ({
        video_id: video.id,
        category_name: catName,
      }));

      await VideoCategory.bulkCreate(rows);
    }

    return video;
  }

  /**
   * Get all videos
   * @returns {Promise<Array<Object>>} List of all videos
   */
  async getAllVideos() {
    return await videoRepository.findAll();
  }
   async getDraftVideos() {
    return await videoRepository.findUnPublishedVideo();
  }



  /**
   * Get all distinct category names used in videos
   * @returns {Promise<Array<string>>} List of category names
   */
  async getAllCategories() {
    const rows = await VideoCategory.findAll({
      attributes: ['category_name'],
      group: ['category_name'],
      order: [['category_name', 'ASC']],
    });

    return rows.map((row) => row.category_name);
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
   * Get videos filtered by category name
   * @param {string} categoryName - Category to filter by
   * @returns {Promise<Array<Object>>} List of videos
   */
  async getVideosByCategory(categoryName) {
    const videos = await videoRepository.findByCategory(categoryName);

    // Attach categories array from VideoCategories association
    return videos.map((video) => {
      const plain = video.toJSON();
      plain.categories = (video.VideoCategories || []).map(
        (vc) => vc.category_name
      );
      delete plain.VideoCategories;
      return plain;
    });
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

    const plain = video.toJSON();
    plain.categories = (video.VideoCategories || []).map(
      (vc) => vc.category_name
    );
    delete plain.VideoCategories;

    return plain;
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

  // 🔑 Allow only specific fields to be updated
  const allowedUpdates = {};

  if (updates.title !== undefined) {
    allowedUpdates.title = updates.title;
  }

  if (updates.description !== undefined) {
    allowedUpdates.description = updates.description;
  }

  if (updates.thumbnailPath !== undefined) {
    allowedUpdates.thumbnailPath = updates.thumbnailPath;
  }

  // ✅ FORCE publish (draft → false)
  allowedUpdates.draft = false;

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