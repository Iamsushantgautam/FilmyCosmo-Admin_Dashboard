const mongoose = require('mongoose');

const HomeConfigSchema = new mongoose.Schema(
  {
    heroTitle: {
      type: String,
      default: 'Welcome to FilmyCosmo',
    },
    heroSubtitle: {
      type: String,
      default:
        'Explore the latest movies, discover trending films, and enjoy a curated selection from around the cosmos.',
    },
    showTrending: {
      type: Boolean,
      default: true,
    },
    showSearch: {
      type: Boolean,
      default: true,
    },
    showGenres: {
      type: Boolean,
      default: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('HomeConfig', HomeConfigSchema);


