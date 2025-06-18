// src/modules/external_movie_data/external_movie_data.routes.js
const express = require('express');
const router = express.Router();
const externalMovieController = require('./external_movie_data.controller');
const authMiddleware = require('../../middleware/authMiddleware');

// Existing routes:
router.get('/search', authMiddleware, externalMovieController.searchMoviesByTitle);
router.get('/genres', authMiddleware, externalMovieController.getMovieGenres);
router.get('/discover', authMiddleware, externalMovieController.discoverMoviesByGenre);

// --- NEW DETAIL ROUTES (ADD THESE) ---
// Get movie details by IMDb ID (OMDB)
router.get('/details/omdb/:imdbId', authMiddleware, externalMovieController.getMovieDetailsOmdb);

// Get movie details by TMDB ID
router.get('/details/tmdb/:tmdbId', authMiddleware, externalMovieController.getMovieDetailsTmdb);

module.exports = router;