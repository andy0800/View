// backend/src/routes/sections.js
const express = require('express');
const router = express.Router();
const { authenticate, authorizeRoles } = require('../middleware/authMiddleware');
const viewerController = require('../controllers/viewerController');

// Public sections: same shape as viewer sections
router.get('/', viewerController.getSections);

// Public ads by section: proxy to viewer's logic (without auth it will not filter by watched)
router.get('/:sectionKey/ads', (req, res) => {
  // Map param to expected name in viewer controller
  req.params.key = req.params.sectionKey;
  return viewerController.getSectionVideos(req, res);
});

module.exports = router;