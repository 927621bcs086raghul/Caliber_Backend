const Video = require('../models/video');
const User = require('../models/user');

class VideoRepository {
  /**
   * Create a new video
   * @param {Object} videoData - Video data
   * @returns {Promise<Video>}
   */
  async create(videoData) {
    return await Video.create(videoData);
  }

  /**
   * Find all videos with user information
   * @returns {Promise<Array<Video>>}
   */
  async findAll() {
    console.log('hi')
    return await Video.findAll({
      where: {
      draft: false,   // ✅ published videos
    },
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email'],
        },
      ],
    });
  }

    /**
   * Find all videos with user information
   * @returns {Promise<Array<Video>>}
   */
  async findUnPublishedVideo() {
    return await Video.findAll({
      where: {
      draft: true,   // ✅ published videos
    },
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email'],
        },
      ],
    });
  }

  /**
   * Find videos by user ID
   * @param {number} userId - User ID
   * @returns {Promise<Array<Video>>}
   */
  async findByUserId(userId) {
    return await Video.findAll({
      where: { user_id: userId },
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email'],
        },
      ],
    });
  }

  /**
   * Find a video by ID
   * @param {number} id - Video ID
   * @returns {Promise<Video|null>}
   */
  async findById(id) {
    return await Video.findByPk(id, {
      include: {
        model: User,
        attributes: ['id', 'name', 'email'],
      },
    });
  }

  /**
   * Update a video
   * @param {Video} video - Video instance to update
   * @param {Object} updates - Fields to update
   * @returns {Promise<Video>}
   */
  async update(video, updates) {
    Object.assign(video, updates);
    return await video.save();
  }

  /**
   * Delete a video
   * @param {number} id - Video ID
   * @returns {Promise<number>} Number of rows deleted
   */
  async delete(id) {
    return await Video.destroy({ where: { id } });
  }

  /**
   * Find videos with pagination
   * @param {number} limit - Number of videos per page
   * @param {number} offset - Starting position
   * @returns {Promise<Array<Video>>}
   */
  async findWithPagination(limit, offset) {
    return await Video.findAll({
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email'],
        },
      ],
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });
  }

  /**
   * Count total videos
   * @returns {Promise<number>}
   */
  async count() {
    return await Video.count();
  }
}

module.exports = new VideoRepository();