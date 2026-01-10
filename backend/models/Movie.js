const mongoose = require("mongoose");

/* ---------- Sub Schemas ---------- */

const DownloadLinkSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    url: { type: String, required: true },
    size: { type: String },
    quality: { type: String }
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

    movie_genre: [String],
    movie_duration: String,
    movie_language: [String],
    movie_starcast: [String],
    movie_type: String,
    movie_size: String,

    download_links: [DownloadLinkSchema],

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
