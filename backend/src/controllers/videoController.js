const { Op } = require('sequelize');
const { Video, ViewEvent, Wallet, Transaction } = require('../models');
const { AdvertiserPackage } = require('../models');

// GET /api/videos/next
async function getNextVideo(req, res) {
  const userId = req.user.id;
  const lastViewedId = await req.redis.get(`lastViewed:${userId}`);

  let next;
  if (lastViewedId) {
    // find last viewed record
    const last = await Video.findByPk(lastViewedId);
    if (last) {
      next = await Video.findOne({
        where: {
          status: 'active',
          createdAt: { [Op.gt]: last.createdAt }
        },
        order: [['createdAt', 'ASC']]
      });
    }
  }
  // fallback to very first video
  if (!next) {
    next = await Video.findOne({
      where: { status: 'active' },
      order: [['createdAt', 'ASC']]
    });
  }

  if (!next) return res.status(404).json({ message: 'No videos available' });
  res.json(next);
}

// POST /api/videos/complete
async function completeView(req, res) {
  const { videoId } = req.body;
  const userId = req.user.id;

  const video = await Video.findByPk(videoId);
  if (!video) return res.status(404).json({ message: 'Video not found' });

  const pkg = PACKAGES[video.packageId];
  const viewerPts = pkg.viewer_cut;
  const companyPts = pkg.company_cut;

  // record view event
  await ViewEvent.create({ videoId, userId });

  // credit viewer
  await Wallet.increment('pending_points', {
    by: viewerPts,
    where: { userId }
  });
  await Transaction.create({
    userId,
    type: 'earn',
    amount_pts: viewerPts,
    status: 'completed'
  });

  // charge advertiser
  await Wallet.decrement('confirmed_points', {
    by: viewerPts + companyPts,
    where: { userId: video.advertiserId }
  });
  await Transaction.create({
    userId: video.advertiserId,
    type: 'purchase',
    amount_pts: viewerPts + companyPts,
    status: 'completed'
  });

  // mark last viewed in Redis
  await req.redis.set(`lastViewed:${userId}`, videoId);

  res.json({ success: true, earned: viewerPts });
}

module.exports = { getNextVideo, completeView };