// backend/src/routes/comments.js
'use strict';

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const {
  createComment,
  getComments,
  updateComment,
  deleteComment,
  toggleCommentLike,
  getCommentStats
} = require('../controllers/commentController');

// All comment routes require authentication
router.use(authenticate);

// Create a new comment
router.post('/', createComment);

// Get comments for an ad
router.get('/ad/:adId', getComments);

// Get comment statistics for an ad
router.get('/ad/:adId/stats', getCommentStats);

// Update a comment (owner only)
router.put('/:id', updateComment);

// Delete a comment (owner only)
router.delete('/:id', deleteComment);

// Toggle like on a comment
router.post('/:id/like', toggleCommentLike);

module.exports = router;
