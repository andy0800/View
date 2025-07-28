const { Wallet, Transaction } = require('../models');

async function getBalance(req, res) {
  const wallet = await Wallet.findOne({ where: { userId: req.user.id } });
  res.json({ confirmed: wallet.confirmed_points, pending: wallet.pending_points });
}

async function redeemPoints(req, res) {
  const { amount } = req.body; // in fils
  const wallet = await Wallet.findOne({ where: { userId: req.user.id } });

  if (wallet.confirmed_points < amount) {
    return res.status(400).json({ message: 'Insufficient balance' });
  }

  await Wallet.decrement('confirmed_points', { by: amount, where: { userId: req.user.id } });
  await Transaction.create({
    userId: req.user.id,
    type: 'withdraw',
    amount_pts: amount,
    status: 'pending',
  });

  res.json({ message: 'Redeem request submitted' });
}

module.exports = { getBalance, redeemPoints };