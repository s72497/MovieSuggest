// src/modules/interactions/watchlist.routes.js
const express = require('express');
const router = express.Router();
const watchlistController = require('./watchlist.controller');
const authMiddleware = require('../../middleware/authMiddleware');

// Add movie to user's watchlist
router.post('/', authMiddleware, watchlistController.addMovieToWatchlist);

// Get user's watchlist
router.get('/users/:userId', authMiddleware, watchlistController.getUserWatchlist);

// Remove movie from user's watchlist
router.delete('/:watchlistId', authMiddleware, watchlistController.removeMovieFromWatchlist);

module.exports = router;