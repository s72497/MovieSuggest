// src/config/db.js
const mysql = require('mysql2/promise'); // Using 'mysql2/promise' for async/await
require('dotenv').config(); // Load environment variables

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'admin', 
    database: process.env.DB_NAME || 'movie_system_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test connection (optional, but good for debugging)
pool.getConnection()
    .then(connection => {
        console.log('Successfully connected to the database.');
        connection.release(); // Release the connection immediately
    })
    .catch(err => {
        console.error('Error connecting to the database:', err.message);
        // Consider exiting the process if DB connection is critical and fails on startup
        process.exit(1);
    });

module.exports = pool;