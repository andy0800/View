// backend/src/controllers/commentController.js
'use strict';

const { Comment, User, CommentLike, Ad } = require('../models');
const { Op } = require('sequelize');

// Create a new comment
const createComment = async (req, res) => {
  try {
    // Prevent admin users from creating comments
    if (req.user.id === 0) {
      return res.status(403).json({
        success: false,
        message: 'Admin users cannot create comments'
      });
    }
    
    const { ad_id, content, parent_id } = req.body;
    const user_id = req.user.id;

    // Validate input
    if (!ad_id || !content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Ad ID and content are required'
      });
    }

    // Check if ad exists and is active
    const ad = await Ad.findOne({
      where: { 
        id: ad_id, 
        is_active: true,
        status: 'active'
      }
    });

    if (!ad) {
      return res.status(404).json({
        success: false,
        message: 'Ad not found or not active'
      });
    }

    // Check content length
    if (content.trim().length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Comment content cannot exceed 1000 characters'
      });
    }

    // If this is a reply, check if parent comment exists
    if (parent_id) {
      const parentComment = await Comment.findByPk(parent_id);
      if (!parentComment) {
        return res.status(404).json({
          success: false,
          message: 'Parent comment not found'
        });
      }
    }

    // Create the comment
    const comment = await Comment.create({
      ad_id,
      user_id,
      content: content.trim(),
      parent_id: parent_id || null
    });

    // If this is a reply, increment parent's reply count
    if (parent_id) {
      await Comment.increment('replies_count', { where: { id: parent_id } });
    }

    // Fetch the comment with user details
    const commentWithUser = await Comment.findByPk(comment.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'phone', 'role']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Comment created successfully',
      data: commentWithUser
    });

  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create comment',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get comments for an ad
const getComments = async (req, res) => {
  try {
    const { adId } = req.params;
    const { page = 1, limit = 20, parent_id = null } = req.query;
    const offset = (page - 1) * limit;

    // Validate ad exists
    const ad = await Ad.findByPk(adId);
    if (!ad) {
      return res.status(404).json({
        success: false,
        message: 'Ad not found'
      });
    }

    // Build where clause
    const whereClause = {
      ad_id: adId,
      is_deleted: false
    };

    if (parent_id) {
      whereClause.parent_id = parent_id;
    } else {
      whereClause.parent_id = null; // Only top-level comments
    }

    // Get comments with pagination
    const { count, rows: comments } = await Comment.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'phone', 'role']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Get total pages
    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      success: true,
      data: {
        comments,
        pagination: {
          current_page: parseInt(page),
          total_pages: totalPages,
          total_comments: count,
          has_next: page < totalPages,
          has_prev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Error fetching comments:', error);
    
    // Handle specific error types gracefully
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid request parameters',
        error: 'VALIDATION_ERROR'
      });
    }
    
    if (error.name === 'SequelizeDatabaseError') {
      console.error('❌ Database error in comment fetching:', error);
      return res.status(503).json({
        success: false,
        message: 'Comment service temporarily unavailable',
        error: 'SERVICE_UNAVAILABLE'
      });
    }
    
    // Handle any other unexpected errors
    console.error('❌ Unexpected error in comment fetching:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch comments',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Update a comment (owner only)
const updateComment = async (req, res) => {
  try {
    // Prevent admin users from updating comments
    if (req.user.id === 0) {
      return res.status(403).json({
        success: false,
        message: 'Admin users cannot update comments'
      });
    }
    
    const { id } = req.params;
    const { content } = req.body;
    const user_id = req.user.id;

    // Validate input
    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Content is required'
      });
    }

    // Check content length
    if (content.trim().length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Comment content cannot exceed 1000 characters'
      });
    }

    // Find the comment
    const comment = await Comment.findOne({
      where: { id, user_id, is_deleted: false }
    });

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found or you are not authorized to edit it'
      });
    }

    // Update the comment
    await comment.update({
      content: content.trim()
    });

    res.status(200).json({
      success: true,
      message: 'Comment updated successfully',
      data: comment
    });

  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update comment',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Delete a comment (owner only)
const deleteComment = async (req, res) => {
  try {
    // Prevent admin users from deleting comments
    if (req.user.id === 0) {
      return res.status(403).json({
        success: false,
        message: 'Admin users cannot delete comments'
      });
    }
    
    const { id } = req.params;
    const user_id = req.user.id;

    // Find the comment
    const comment = await Comment.findOne({
      where: { id, user_id, is_deleted: false }
    });

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found or you are not authorized to delete it'
      });
    }

    // Soft delete the comment
    await comment.update({
      is_deleted: true,
      deleted_at: new Date()
    });

    // If this is a reply, decrement parent's reply count
    if (comment.parent_id) {
      await Comment.decrement('replies_count', { where: { id: comment.parent_id } });
    }

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete comment',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Toggle like on a comment
const toggleCommentLike = async (req, res) => {
  try {
    // Prevent admin users from liking comments
    if (req.user.id === 0) {
      return res.status(403).json({
        success: false,
        message: 'Admin users cannot like comments'
      });
    }
    
    const { id } = req.params;
    const user_id = req.user.id;

    // Check if comment exists
    const comment = await Comment.findOne({
      where: { id, is_deleted: false }
    });

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check if user already liked the comment
    const existingLike = await CommentLike.findOne({
      where: { comment_id: id, user_id }
    });

    if (existingLike) {
      // Unlike
      await existingLike.destroy();
      await comment.decrement('likes_count');
      
      res.status(200).json({
        success: true,
        message: 'Comment unliked',
        data: { liked: false, likes_count: comment.likes_count - 1 }
      });
    } else {
      // Like
      await CommentLike.create({
        comment_id: id,
        user_id
      });
      await comment.increment('likes_count');
      
      res.status(200).json({
        success: true,
        message: 'Comment liked',
        data: { liked: true, likes_count: comment.likes_count + 1 }
      });
    }

  } catch (error) {
    console.error('Error toggling comment like:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle comment like',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get comment statistics for an ad
const getCommentStats = async (req, res) => {
  try {
    const { adId } = req.params;

    // Validate ad exists
    const ad = await Ad.findByPk(adId);
    if (!ad) {
      return res.status(404).json({
        success: false,
        message: 'Ad not found'
      });
    }

    // Get comment counts
    const totalComments = await Comment.count({
      where: { ad_id: adId, is_deleted: false }
    });

    const topLevelComments = await Comment.count({
      where: { ad_id: adId, parent_id: null, is_deleted: false }
    });

    const totalLikes = await CommentLike.count({
      include: [{
        model: Comment,
        as: 'comment',
        where: { ad_id: adId, is_deleted: false }
      }]
    });

    res.status(200).json({
      success: true,
      data: {
        total_comments: totalComments,
        top_level_comments: topLevelComments,
        total_likes: totalLikes
      }
    });

  } catch (error) {
    console.error('Error fetching comment stats:', error);
    
    // Handle specific error types gracefully
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid request parameters',
        error: 'VALIDATION_ERROR'
      });
    }
    
    if (error.name === 'SequelizeDatabaseError') {
      console.error('❌ Database error in comment stats:', error);
      return res.status(503).json({
        success: false,
        message: 'Comment statistics service temporarily unavailable',
        error: 'SERVICE_UNAVAILABLE'
      });
    }
    
    // Handle any other unexpected errors
    console.error('❌ Unexpected error in comment stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch comment statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  createComment,
  getComments,
  updateComment,
  deleteComment,
  toggleCommentLike,
  getCommentStats
};
