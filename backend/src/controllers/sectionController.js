// backend/src/controllers/sectionController.js
// Dummy data or fetch from DB
const sections = [
  { id: 1, title: 'Popular Ads', key: 'popular' },
  { id: 2, title: 'New Videos',  key: 'new' },
  { id: 3, title: 'Recommended', key: 'recommended' },
];

exports.getSections = async (req, res, next) => {
  try {
    // If you have a Sections model, replace with DB fetch
    return res.json(sections)
  } catch (err) {
    next(err)
  }
}