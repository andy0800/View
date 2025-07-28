// backend/src/routes/sections.js
const express           = require('express')
const { getSections }   = require('../controllers/sectionController')
const router            = express.Router()

// Dummy “majors”; swap with real DB/Sequelize calls as needed
const sections = [
  { id: 1, title: 'Retail & Sales', thumbnailUrl: '/uploads/thumbs/retail.jpg' },
  { id: 2, title: 'Food & Beverage', thumbnailUrl: '/uploads/thumbs/food.jpg' },
  { id: 3, title: 'Technology', thumbnailUrl: '/uploads/thumbs/tech.jpg' },
];

// Dummy videos grouped by section
const videosBySection = {
  1: [
    { id: 101, title: 'Retail Trends 2025', url: '/uploads/videos/101.mp4' },
    { id: 102, title: 'Customer Service Tips', url: '/uploads/videos/102.mp4' },
  ],
  2: [
    { id: 201, title: 'Healthy Cooking Hacks', url: '/uploads/videos/201.mp4' },
    { id: 202, title: 'Food Safety 101', url: '/uploads/videos/202.mp4' },
  ],
  3: [
    { id: 301, title: 'AI in Business', url: '/uploads/videos/301.mp4' },
    { id: 302, title: 'Cybersecurity Basics', url: '/uploads/videos/302.mp4' },
  ],
};

// GET /api/sections
router.get('/', (req, res) => {
  res.json(sections);
});

// GET /api/sections/:sectionId/videos
router.get('/:sectionId/videos', (req, res) => {
  const vids = videosBySection[req.params.sectionId] || [];
  res.json(vids);
});
router.get('/', getSections)
module.exports = router;