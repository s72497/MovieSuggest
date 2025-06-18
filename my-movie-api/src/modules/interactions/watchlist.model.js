// src/modules/interactions/watchlist.model.js
const pool = require('../../config/db');

class Watchlist {
    static async addMovie(userId, movieApiId) {
        try {
            const [result] = await pool.execute(
                'INSERT INTO watchlists (user_id, movie_api_id) VALUES (?, ?)',
                [userId, movieApiId]
            );
            return result.insertId;
        } catch (error) {
            console.error('Error adding movie to watchlist:', error);
            throw error;
        }
    }

    static async removeMovie(watchlistId) {
        try {
            const [result] = await pool.execute('DELETE FROM watchlists WHERE id = ?', [watchlistId]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error removing movie from watchlist:', error);
            throw error;
        }
    }

    static async getByUser(userId) {
        try {
            // Select only movie_api_id for simplicity, you can select more if needed
            const [rows] = await pool.execute('SELECT id, movie_api_id FROM watchlists WHERE user_id = ?', [userId]);
            return rows;
        } catch (error) {
            console.error('Error fetching user watchlist:', error);
            throw error;
        }
    }

    static async getWatchlistItemById(watchlistId) {
        try {
            // Used for authorization check in controller
            const [rows] = await pool.execute('SELECT id, user_id, movie_api_id FROM watchlists WHERE id = ?', [watchlistId]);
            return rows[0]; // Return the watchlist item or undefined
        } catch (error) {
            console.error('Error fetching watchlist item by ID:', error);
            throw error;
        }
    }
}

module.exports = Watchlist;