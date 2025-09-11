const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticateToken } = require('../middleware/middleware');
 
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});
router.get('/colleges', async (req, res) => {
  try {
    const colleges = await User.distinct('collegeName');
    res.json(colleges);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});
router.get('/branches', async (req, res) => {
  try {
    const collegeBranchData = await User.aggregate([
      {
        $group: {
          _id: { college: "$collegeName", branch: "$branch" }, // <-- fixed field
        },
      },
      {
        $project: {
          _id: 0,
          college: "$_id.college",
          branch: "$_id.branch",
        },
      },
      {
        $sort: { college: 1, branch: 1 }
      }
    ]);

    res.json(collegeBranchData);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const updates = req.body;
    delete updates.password;
 
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');
 
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});
 
module.exports = router;
 
  