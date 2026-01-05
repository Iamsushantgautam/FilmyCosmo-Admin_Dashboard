const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/admin'); // make sure you have this file
const multer = require('multer');
const cloudinary = require('../config/cloudinary'); // optional if using file upload
const Movie = require('../models/Movie');
const streamifier = require('streamifier');

// Multer in-memory storage (optional)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Helper function: upload buffer to Cloudinary
const uploadBuffer = (fileBuffer, folder = 'movie_app') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream({ folder }, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });
};


// ------------------- GET all movies -------------------
router.get('/', async (req, res) => {
  try {
    const movies = await Movie.find().sort({ createdAt: -1 });
    res.json(movies);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// ------------------- GET single movie by ID -------------------
router.get('/:id', async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return res.status(404).json({ msg: 'Movie not found' });
    }
    res.json(movie);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// ------------------- CREATE movie (admin only) -------------------
router.post(
  '/',
  [
    auth,
    isAdmin,
    upload.fields([{ name: 'poster', maxCount: 1 }, { name: 'screenshots', maxCount: 6 }])
  ],
  async (req, res) => {
    try {
      const { title, description, year, tags, posterUrl, screenshots, isActive } = req.body;
      if (!title) return res.status(400).json({ msg: 'Title is required' });

      let poster = posterUrl || '';
      let screenshotUrls = screenshots || [];

      // Optional: upload files if provided
      if (req.files && req.files.poster && req.files.poster[0]) {
        const result = await uploadBuffer(req.files.poster[0].buffer, 'posters');
        poster = result.secure_url;
      }

      if (req.files && req.files.screenshots) {
        for (const s of req.files.screenshots) {
          const r = await uploadBuffer(s.buffer, 'screenshots');
          screenshotUrls.push(r.secure_url);
        }
      }

      const movie = new Movie({
        title,
        description,
        year: year ? parseInt(year) : undefined,
        tags: tags ? tags.split(',').map(t => t.trim()) : [],
        posterUrl: poster,
        screenshots: screenshotUrls,
        isActive: typeof isActive === 'boolean' ? isActive : true,
        createdBy: req.user.id
      });

      await movie.save();
      res.json({ msg: 'Movie added successfully', movie });
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Movie creation failed', error: err.message });
    }
  }
);

// ------------------- EDIT / UPDATE movie (admin only) -------------------
router.put('/:id', [auth, isAdmin], async (req, res) => {
  try {
    const { title, description, year, tags, posterUrl, screenshots, isActive } = req.body;
    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).json({ msg: 'Movie not found' });

    if (title) movie.title = title;
    if (description) movie.description = description;
    if (year) movie.year = parseInt(year);
    if (tags) movie.tags = tags.split(',').map(t => t.trim());
    if (posterUrl) movie.posterUrl = posterUrl;
    if (screenshots) movie.screenshots = screenshots;
    if (typeof isActive === 'boolean') movie.isActive = isActive;

    await movie.save();
    res.json({ msg: 'Movie updated successfully', movie });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Movie update failed', error: err.message });
  }
});

// ------------------- DELETE movie (admin only) -------------------
router.delete('/:id', [auth, isAdmin], async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).json({ msg: 'Movie not found' });

    await movie.remove();
    res.json({ msg: 'Movie deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Movie deletion failed', error: err.message });
  }
});

module.exports = router;
