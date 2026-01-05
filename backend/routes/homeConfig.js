const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/admin');
const HomeConfig = require('../models/HomeConfig');

// Get current home configuration (public)
router.get('/', async (req, res) => {
  try {
    let cfg = await HomeConfig.findOne().sort({ updatedAt: -1 });
    if (!cfg) {
      cfg = await HomeConfig.create({});
    }
    res.json(cfg);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Failed to fetch home config', error: err.message });
  }
});

// Update home configuration (admin only)
router.put('/', [auth, isAdmin], async (req, res) => {
  try {
    const { heroTitle, heroSubtitle, showTrending, showSearch, showGenres } = req.body;

    let cfg = await HomeConfig.findOne().sort({ updatedAt: -1 });
    if (!cfg) {
      cfg = new HomeConfig();
    }

    if (typeof heroTitle === 'string') cfg.heroTitle = heroTitle;
    if (typeof heroSubtitle === 'string') cfg.heroSubtitle = heroSubtitle;
    if (typeof showTrending === 'boolean') cfg.showTrending = showTrending;
    if (typeof showSearch === 'boolean') cfg.showSearch = showSearch;
    if (typeof showGenres === 'boolean') cfg.showGenres = showGenres;

    cfg.updatedBy = req.user && req.user.id;

    await cfg.save();
    res.json({ msg: 'Home config updated', config: cfg });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Failed to update home config', error: err.message });
  }
});

module.exports = router;


