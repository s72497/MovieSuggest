// src/modules/interactions/watchlist.controller.js
const Watchlist = require('./watchlist.model');
const Movie = require('../external_movie_data/external_movie_data.controller'); // To verify movie existence (optional but good)

exports.addMovieToWatchlist = async (req, res) => {
    const { movie_api_id } = req.body; // Expecting the OMDB/TMDB ID
    const userId = req.user.id; // From authenticated token

    if (!movie_api_id) {
        return res.status(400).json({ message: 'Movie ID is required.' });
    }

    try {
        // Optional: Verify movie_api_id exists on OMDB/TMDB
        // This would involve making another call to OMDB/TMDB for specific movie details
        // and checking if it returns a valid movie. For simplicity, we'll skip this check for now.
        // If you implement this, consider using a separate helper in external_movie_data module.

        const watchlistId = await Watchlist.addMovie(userId, movie_api_id);
        res.status(201).json({ message: 'Movie added to watchlist successfully', watchlistId });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Movie already in watchlist for this user.' });
        }
        console.error('Error adding movie to watchlist:', error);
        res.status(500).json({ message: 'Server error adding movie to watchlist.' });
    }
};

exports.getUserWatchlist = async (req, res) => {
    const authenticatedUserId = req.user.id; // Get the ID of the logged-in user
    const userIdInParams = parseInt(req.params.userId, 10); // ID from URL parameter

    // Authorization check: User can only view their own watchlist
    if (userIdInParams !== authenticatedUserId) {
        return res.status(403).json({ message: 'Forbidden: You can only view your own watchlist.' });
    }

    try {
        const watchlistItems = await Watchlist.getByUser(authenticatedUserId);

        // Optional: For a richer response, you could loop through watchlistItems
        // and fetch full movie details for each movie_api_id from OMDB/TMDB
        // using your external_movie_data.controller functions.
        // This would require more complex async logic.

        res.json(watchlistItems);
    } catch (error) {
        console.error('Error fetching watchlist:', error);
        res.status(500).json({ message: 'Server error fetching watchlist.' });
    }
};

exports.removeMovieFromWatchlist = async (req, res) => {
    const { watchlistId } = req.params;
    const authenticatedUserId = req.user.id;

    try {
        const existingWatchlistItem = await Watchlist.getWatchlistItemById(watchlistId);

        if (!existingWatchlistItem) {
            return res.status(404).json({ message: 'Watchlist item not found.' });
        }

        if (existingWatchlistItem.user_id !== authenticatedUserId) {
            return res.status(403).json({ message: 'Forbidden: You can only remove items from your own watchlist.' });
        }

        const success = await Watchlist.removeMovie(watchlistId);

        if (!success) {
            return res.status(500).json({ message: 'Failed to remove movie from watchlist.' });
        }

        res.json({ message: 'Movie removed from watchlist successfully' });
    } catch (error) {
        console.error('Error removing movie from watchlist:', error);
        res.status(500).json({ message: 'Server error removing movie from watchlist.' });
    }
};