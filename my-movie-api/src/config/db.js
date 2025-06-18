// src/config/db.js
const { Pool } = require('pg'); // Changed from mysql2/promise to pg
require('dotenv').config(); // Load environment variables

// Use DATABASE_URL for Render production deployment
// Fallback to individual variables for local development (if needed, but DATABASE_URL is preferred for consistency)
const pool = new Pool({
    connectionString: process.env.DATABASE_URL, // This is the primary way to connect on Render
    ssl: {
        rejectUnauthorized: false // Required for Render's managed PostgreSQL to work with Node.js driver
    }
    // For local development, you might have something like:
    // host: process.env.DB_HOST || 'localhost',
    // user: process.env.DB_USER || 'your_local_pg_user',
    // password: process.env.DB_PASSWORD || 'your_local_pg_password',
    // database: process.env.DB_NAME || 'your_local_pg_db'
});

// Test connection
pool.connect()
    .then(client => {
        console.log('Successfully connected to the PostgreSQL database.');
        client.release(); // Release the connection immediately
    })
    .catch(err => {
        console.error('Error connecting to the PostgreSQL database:', err.message);
        // Exit the process if the database connection is critical and fails on startup
        process.exit(1);
    });

module.exports = pool;
