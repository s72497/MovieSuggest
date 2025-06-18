// src/modules/users/user.model.js
const pool = require('../../config/db');

class User {
    static async create(username, email, passwordHash) {
        const query = 'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)';
        const [result] = await pool.execute(query, [username, email, passwordHash]);
        return result.insertId; // Returns the ID of the newly created user
    }

    static async findByUsername(username) {
        const query = 'SELECT user_id, username, email, password_hash FROM users WHERE username = ?';
        const [rows] = await pool.execute(query, [username]);
        return rows[0]; // Returns the first user found or undefined
    }

    // --- NEW: Find user by ID ---
    static async findById(userId) {
        const query = 'SELECT user_id, username, email, created_at, updated_at FROM users WHERE user_id = ?';
        const [rows] = await pool.execute(query, [userId]);
        return rows[0]; // Returns the user found or undefined (excluding password_hash for safety)
    }

    // --- NEW: Update user details ---
    static async update(userId, updates) {
        const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
        const values = Object.values(updates);

        if (fields.length === 0) {
            return false; // No fields to update
        }

        const query = `UPDATE users SET ${fields}, updated_at = NOW() WHERE user_id = ?`;
        values.push(userId);

        try {
            const [result] = await pool.execute(query, values);
            return result.affectedRows > 0; // True if a row was updated
        } catch (error) {
            console.error('Error updating user in DB:', error);
            throw error; // Re-throw to be caught by controller
        }
    }
}

module.exports = User;