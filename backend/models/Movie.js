const mongoose = require("mongoose");

/* ---------- Sub Schemas ---------- */

const DownloadLinkSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    url: { type: String, required: true },
    size: { type: String },
    quality: { type: String },
    click_count: { type: Number, default: 0 }
  },
  { _id: false }
);

const ShortLinkSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    url: { type: String, required: true },
    original_url: { type: String },
    size: { type: String },
    click_count: { type: Number, default: 0 }
  },
  { _id: false }
);

/* ---------- Movie Schema ---------- */

const MovieSchema = new mongoose.Schema(
  {
    movie_name: { type: String, required: true },
    movie_description: String,
    movie_poster: String,
    movie_screenshots: [String],
    movie_year: Number,
    movie_tags: [String],
    movie_show: { type: Boolean, default: true },
    trending: { type: Boolean, default: false },

    movie_genre: [String],
    movie_duration: String,
    movie_language: [String],
    movie_starcast: [String],
    movie_type: String,
    movie_size: String,

    download_links: [DownloadLinkSchema],
    short_links: [ShortLinkSchema],

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Movie", MovieSchema);
