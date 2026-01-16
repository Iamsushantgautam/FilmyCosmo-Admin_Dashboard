const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/admin');
const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const Movie = require('../models/Movie');
const streamifier = require('streamifier');
const https = require('https');

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


// Helper to validate and normalize download links array
const normalizeDownloadLinks = (links) => {
  if (!links) return [];
  if (typeof links === 'string') {
    try {
      links = JSON.parse(links);
    } catch (e) {
      return [];
    }
  }
  if (!Array.isArray(links)) return [];
  return links.filter(link => link && link.label && link.url && link.url.trim() !== '').map(link => ({
    label: link.label.trim(),
    url: link.url.trim(),
    size: link.size ? link.size.trim() : undefined,
    quality: link.quality ? link.quality.trim() : undefined,
    click_count: link.click_count || 0
  }));
};

// Helper to generate short link using AdrinoLinks API
const generateShortLink = (longUrl) => {
  return new Promise((resolve, reject) => {
    try {
      const apiToken = process.env.TERABOXLINKS_API_KEY;
      const baseUrl = process.env.TERABOXLINKS_BASE_URL;
      const apiUrl = `${baseUrl}?api=${apiToken}&url=${encodeURIComponent(longUrl)}`;

      https.get(apiUrl, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            const jsonData = JSON.parse(data);
            if (jsonData.shortenedUrl) {
              resolve(jsonData.shortenedUrl);
            } else {
              resolve(longUrl); // Return original if failed
            }
          } catch (e) {
            console.error('Error parsing short link response:', e);
            resolve(longUrl); // Return original on parse error
          }
        });
      }).on('error', (error) => {
        console.error('Error generating short link:', error);
        resolve(longUrl); // Return original on error
      });
    } catch (error) {
      console.error('Error in generateShortLink:', error);
      resolve(longUrl); // Return original on error
    }
  });
};

// Helper to generate short links from download links
const generateShortLinks = async (downloadLinks) => {
  if (!downloadLinks || !Array.isArray(downloadLinks) || downloadLinks.length === 0) {
    return [];
  }

  const shortLinks = [];
  for (const link of downloadLinks) {
    if (link.url && link.url.trim()) {
      try {
        const shortUrl = await generateShortLink(link.url);
        shortLinks.push({
          label: link.label || '',
          url: shortUrl,
          original_url: link.url,
          size: link.size || '',
          click_count: 0
        });
      } catch (error) {
        console.error(`Error generating short link for ${link.url}:`, error);
        // Add original URL if short link generation fails
        shortLinks.push({
          label: link.label || '',
          url: link.url,
          original_url: link.url,
          size: link.size || '',
          click_count: 0
        });
      }
    }
  }
  return shortLinks;
};

// Helper to normalize short links array
const normalizeShortLinks = (links) => {
  if (!links) return [];
  if (typeof links === 'string') {
    try {
      links = JSON.parse(links);
    } catch (e) {
      return [];
    }
  }
  if (!Array.isArray(links)) return [];
  return links.filter(link => link && link.url && link.url.trim() !== '').map(link => ({
    label: link.label ? link.label.trim() : '',
    url: link.url.trim(),
    original_url: link.original_url ? link.original_url.trim() : link.url.trim(),
    size: link.size ? link.size.trim() : undefined,
    click_count: link.click_count || 0
  }));
};

// Helper function to transform movie data for frontend compatibility
const transformMovie = (movie) => {
  if (!movie) return null;
  const obj = movie.toObject ? movie.toObject() : movie;
  return {
    ...obj,
    // Map backend fields to frontend expected fields
    title: obj.movie_name || obj.title,
    posterUrl: obj.movie_poster || obj.posterUrl,
    description: obj.movie_description || obj.description,
    year: obj.movie_year || obj.year,
    tags: obj.movie_tags || obj.movie_genre || obj.tags || [],
    isActive: obj.movie_show !== undefined ? obj.movie_show : (obj.isActive !== false),
    trending: obj.trending || false,
    screenshots: obj.movie_screenshots || obj.screenshots || [],
    downloadLinks: Array.isArray(obj.download_links) ? obj.download_links : [],
    shortLinks: Array.isArray(obj.short_links) ? obj.short_links : []
  };
};

// ------------------- GET all movies (PUBLIC - no auth required) -------------------
router.get('/', async (req, res) => {
  try {
    // Only return movies that are active (movie_show = true)
    const movies = await Movie.find({ movie_show: { $ne: false } }).sort({ createdAt: -1 });
    const transformed = movies.map(transformMovie);
    res.json(transformed);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// ------------------- GET all movies (ADMIN - with auth, includes inactive) -------------------
router.get('/admin/all', [auth, isAdmin], async (req, res) => {
  try {
    const movies = await Movie.find().sort({ createdAt: -1 });
    const transformed = movies.map(transformMovie);
    res.json(transformed);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// ------------------- GET single movie by ID (PUBLIC) -------------------
router.get('/:id', async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return res.status(404).json({ msg: 'Movie not found' });
    }
    // Only return if active (unless admin requests via admin route)
    if (movie.movie_show === false) {
      return res.status(404).json({ msg: 'Movie not found' });
    }
    res.json(transformMovie(movie));
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
      const {
        movie_name, movie_description, movie_year, movie_tags, movie_poster,
        movie_show, movie_genre, movie_duration, movie_language,
        movie_starcast, movie_type, movie_size, download_links, trending
      } = req.body;

      if (!movie_name) return res.status(400).json({ msg: 'Movie Name is required' });

      let poster = movie_poster || '';
      // Handle screenshots: if sent as array of strings in body, use that, else init empty
      let screenshotUrls = [];
      if (req.body.movie_screenshots) {
        // If it's a string (from FormData), try to split or parse
        screenshotUrls = typeof req.body.movie_screenshots === 'string'
          ? req.body.movie_screenshots.split(',').map(s => s.trim())
          : req.body.movie_screenshots;
      }

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

      // Normalize download links
      const normalizedDownloadLinks = normalizeDownloadLinks(download_links);

      // Generate short links from download links
      const generatedShortLinks = await generateShortLinks(normalizedDownloadLinks);

      const movie = new Movie({
        movie_name,
        movie_description,
        movie_year: movie_year ? parseInt(movie_year) : undefined,
        movie_tags: movie_tags ? (Array.isArray(movie_tags) ? movie_tags : movie_tags.split(',').map(t => t.trim())) : [],
        movie_poster: poster,
        movie_screenshots: screenshotUrls,
        movie_show: movie_show === 'true' || movie_show === true,
        trending: trending === 'true' || trending === true,

        movie_genre: movie_genre ? (Array.isArray(movie_genre) ? movie_genre : movie_genre.split(',').map(t => t.trim())) : [],
        movie_duration,
        movie_language: movie_language ? (Array.isArray(movie_language) ? movie_language : movie_language.split(',').map(t => t.trim())) : [],
        movie_starcast: movie_starcast ? (Array.isArray(movie_starcast) ? movie_starcast : movie_starcast.split(',').map(t => t.trim())) : [],
        movie_type,
        movie_size,

        download_links: normalizedDownloadLinks,
        short_links: generatedShortLinks,

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

// Middleware to conditionally use multer only for multipart requests
const conditionalMulter = (req, res, next) => {
  if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
    return upload.fields([{ name: 'poster', maxCount: 1 }, { name: 'screenshots', maxCount: 6 }])(req, res, next);
  }
  next();
};

// ------------------- EDIT / UPDATE movie (admin only) -------------------
router.put('/:id', [auth, isAdmin, conditionalMulter], async (req, res) => {
  try {
    const {
      movie_name, title, movie_description, description, movie_year, year,
      movie_tags, tags, movie_poster, posterUrl,
      movie_screenshots, screenshots, movie_show, isActive, movie_genre, genre, movie_duration,
      movie_language, language, movie_starcast, starcast, movie_type, type, movie_size, size,
      download_links, trending
    } = req.body;

    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).json({ msg: 'Movie not found' });

    // Validate that movie_name is provided and not empty if it's being updated
    const nameToUpdate = movie_name || title;
    if (nameToUpdate !== undefined && (!nameToUpdate || nameToUpdate.trim() === '')) {
      return res.status(400).json({ msg: 'Movie name cannot be empty' });
    }

    // Handle poster upload if a file is provided
    if (req.files && req.files.poster && req.files.poster[0]) {
      const result = await uploadBuffer(req.files.poster[0].buffer, 'posters');
      movie.movie_poster = result.secure_url;
    } else if (movie_poster !== undefined || posterUrl !== undefined) {
      // Only update poster URL if explicitly provided (not empty string)
      const posterValue = movie_poster || posterUrl;
      if (posterValue !== '' && posterValue !== null) {
        movie.movie_poster = posterValue;
      }
    }

    // Support both field name formats - only update if value is provided
    if (movie_name !== undefined && movie_name !== '') {
      movie.movie_name = movie_name;
    } else if (title !== undefined && title !== '') {
      movie.movie_name = title;
    }

    if (movie_description !== undefined) {
      movie.movie_description = movie_description;
    } else if (description !== undefined) {
      movie.movie_description = description;
    }

    // Handle year - check for valid number
    if (movie_year !== undefined && movie_year !== '' && movie_year !== null) {
      const yearNum = parseInt(movie_year);
      if (!isNaN(yearNum)) movie.movie_year = yearNum;
    } else if (year !== undefined && year !== '' && year !== null) {
      const yearNum = parseInt(year);
      if (!isNaN(yearNum)) movie.movie_year = yearNum;
    }

    // Handle tags - support both formats
    if (movie_tags !== undefined) {
      const tagValue = movie_tags;
      movie.movie_tags = Array.isArray(tagValue) ? tagValue.filter(Boolean) : (tagValue ? tagValue.split(',').map(t => t.trim()).filter(Boolean) : []);
    } else if (tags !== undefined) {
      const tagValue = tags;
      movie.movie_tags = Array.isArray(tagValue) ? tagValue.filter(Boolean) : (tagValue ? tagValue.split(',').map(t => t.trim()).filter(Boolean) : []);
    }

    // Handle screenshots update
    if (req.files && req.files.screenshots && req.files.screenshots.length > 0) {
      const screenshotUrls = [];
      for (const s of req.files.screenshots) {
        const r = await uploadBuffer(s.buffer, 'screenshots');
        screenshotUrls.push(r.secure_url);
      }
      movie.movie_screenshots = screenshotUrls;
    } else if (movie_screenshots !== undefined || screenshots !== undefined) {
      const screenshotsValue = movie_screenshots || screenshots;
      if (screenshotsValue) {
        const screenshotUrls = Array.isArray(screenshotsValue)
          ? screenshotsValue.filter(Boolean)
          : screenshotsValue.split(',').map(s => s.trim()).filter(Boolean);
        movie.movie_screenshots = screenshotUrls;
      }
    }

    // Handle visibility - support both isActive and movie_show
    if (movie_show !== undefined) {
      movie.movie_show = movie_show === true || movie_show === 'true';
    } else if (isActive !== undefined) {
      movie.movie_show = isActive === true || isActive === 'true';
    }

    if (trending !== undefined) {
      movie.trending = trending === true || trending === 'true';
    }

    if (movie_genre !== undefined || genre !== undefined) {
      const genreValue = movie_genre || genre;
      movie.movie_genre = Array.isArray(genreValue) ? genreValue.filter(Boolean) : (genreValue ? genreValue.split(',').map(t => t.trim()).filter(Boolean) : []);
    }

    if (movie_duration !== undefined && movie_duration !== '') {
      movie.movie_duration = movie_duration;
    }

    if (movie_language !== undefined || language !== undefined) {
      const langValue = movie_language || language;
      movie.movie_language = Array.isArray(langValue) ? langValue.filter(Boolean) : (langValue ? langValue.split(',').map(t => t.trim()).filter(Boolean) : []);
    }

    if (movie_starcast !== undefined || starcast !== undefined) {
      const castValue = movie_starcast || starcast;
      movie.movie_starcast = Array.isArray(castValue) ? castValue.filter(Boolean) : (castValue ? castValue.split(',').map(t => t.trim()).filter(Boolean) : []);
    }

    if (movie_type !== undefined && movie_type !== '') {
      movie.movie_type = movie_type;
    } else if (type !== undefined && type !== '') {
      movie.movie_type = type;
    }

    if (movie_size !== undefined && movie_size !== '') {
      movie.movie_size = movie_size;
    } else if (size !== undefined && size !== '') {
      movie.movie_size = size;
    }

    if (download_links !== undefined) {
      const normalizedLinks = normalizeDownloadLinks(download_links);
      movie.download_links = normalizedLinks;

      // Generate short links from download links
      const generatedShortLinks = await generateShortLinks(normalizedLinks);
      movie.short_links = generatedShortLinks;
    }

    await movie.save();
    res.json({ msg: 'Movie updated successfully', movie: transformMovie(movie) });
  } catch (err) {
    console.error('Movie update error:', err);
    res.status(500).json({
      msg: 'Movie update failed',
      error: err.message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// ------------------- TRACK DOWNLOAD LINK CLICK -------------------
router.post('/:id/link/:linkIndex/click', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ msg: 'Invalid Movie ID' });
    }

    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return res.status(404).json({ msg: 'Movie not found' });
    }

    const linkIndex = parseInt(req.params.linkIndex);
    if (isNaN(linkIndex) || linkIndex < 0 || linkIndex >= movie.download_links.length) {
      return res.status(400).json({ msg: 'Invalid link index' });
    }

    if (!movie.download_links[linkIndex].click_count) {
      movie.download_links[linkIndex].click_count = 0;
    }
    movie.download_links[linkIndex].click_count += 1;

    await movie.save();
    res.json({
      msg: 'Click tracked successfully',
      click_count: movie.download_links[linkIndex].click_count
    });
  } catch (err) {
    console.error('Click tracking error:', err);
    res.status(500).json({
      msg: 'Click tracking failed',
      error: err.message
    });
  }
});

// ------------------- DELETE movie (admin only) -------------------
router.delete('/:id', [auth, isAdmin], async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ msg: 'Invalid Movie ID' });
    }

    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return res.status(404).json({ msg: 'Movie not found' });
    }

    await Movie.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Movie deleted successfully' });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({
      msg: 'Movie deletion failed',
      error: err.message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

module.exports = router;
