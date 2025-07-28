const express = require('express');
const { authenticate } = require('../middleware/authMiddleware');
const { getNextVideo, completeView } = require('../controllers/videoController');

const router = express.Router();

router.get('/next', authenticate, getNextVideo);
router.post('/complete', authenticate, completeView);

module.exports = router;