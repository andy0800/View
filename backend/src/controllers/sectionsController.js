// backend/src/controllers/sectionsController.js
const { Section, Ad, PurchasedPackage } = require('../models');
const { Op } = require('sequelize');

// GET /api/sections → List all sections
exports.listSections = async (req, res) => {
  try {
    const sections = await Section.findAll({ 
      where: { is_active: true },
      order: [['sort_order', 'ASC']],
      attributes: ['id', 'key', 'title', 'description', 'icon', 'color', 'ad_count']
    });
    res.json(sections);
  } catch (err) {
    console.error('❌ Failed to fetch sections:', err);
    res.status(500).json({ message: 'Failed to load sections' });
  }
};

// GET /api/sections/:sectionKey/ads → Ads in this section
exports.getVideosBySection = async (req, res) => {
  try {
    const sectionKey = req.params.sectionKey;
    
    // Verify section exists
    const section = await Section.findOne({
      where: { key: sectionKey, is_active: true }
    });

    if (!section) {
      return res.status(404).json({ message: 'Section not found' });
    }

    const ads = await Ad.findAll({
      where: {
        section: sectionKey,
        status: 'active',
        is_active: true,
        verification_status: 'approved', // Only return verified ads
        purchased_package_id: { [Op.ne]: null } // Must have a purchased package
      },
      include: [
        {
          model: PurchasedPackage,
          as: 'purchasedPackage',
          where: {
            remaining_budget: { [Op.gt]: 0 }, // Use purchased package budget
            status: 'active'
          }
        }
      ],
      order: [['created_at', 'DESC']],
      limit: 50
    });
    
    res.json(ads);
  } catch (err) {
    console.error('❌ Failed to fetch section ads:', err);
    res.status(500).json({ message: 'Failed to load ads for this section' });
  }
};