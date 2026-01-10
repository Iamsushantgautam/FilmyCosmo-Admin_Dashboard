const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/admin');

// In-memory config (you can replace with DB model if needed)
let homeConfig = {
  heroTitle: 'Welcome to FilmyCosmo',
  heroSubtitle: 'Explore the latest movies, discover trending films, and enjoy a curated selection from around the cosmos.',
  showTrending: true,
  showSearch: true,
  showGenres: true
};

// GET home config (public)
router.get('/', async (req, res) => {
  try {
    res.json(homeConfig);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// UPDATE home config (admin only)
router.put('/', [auth, isAdmin], async (req, res) => {
  try {
    const { heroTitle, heroSubtitle, showTrending, showSearch, showGenres } = req.body;
    
    if (heroTitle !== undefined) homeConfig.heroTitle = heroTitle;
    if (heroSubtitle !== undefined) homeConfig.heroSubtitle = heroSubtitle;
    if (showTrending !== undefined) homeConfig.showTrending = showTrending;
    if (showSearch !== undefined) homeConfig.showSearch = showSearch;
    if (showGenres !== undefined) homeConfig.showGenres = showGenres;
    
    res.json({ msg: 'Home layout updated successfully', config: homeConfig });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Failed to update home layout', error: err.message });
  }
});

module.exports = router;
