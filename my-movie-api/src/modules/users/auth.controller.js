// src/modules/users/auth.controller.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./user.model'); // Your user model
const { validationResult } = require('express-validator'); // For input validation

// Register function
exports.register = async (req, res) => {
    const { username, email, password } = req.body;

    // Validation check (from express-validator, if used in route)
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log('Validation errors:', errors.array()); // <-- ADD THIS LOG
        return res.status(400).json({ errors: errors.array() });
    }

    if (!username || !email || !password) {
        console.log('Missing fields:', { username, email, password }); // <-- ADD THIS LOG
        return res.status(400).json({ message: 'All fields are required.' });
    }

    try {
        console.log('Attempting to find user by username:', username); // <-- ADD THIS LOG
        const existingUser = await User.findByUsername(username);
        if (existingUser) {
            console.log('Username already exists:', username); // <-- ADD THIS LOG
            return res.status(409).json({ message: 'Username already exists.' });
        }

        console.log('Generating salt and hashing password...'); // <-- ADD THIS LOG
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        console.log('Attempting to create user:', { username, email }); // <-- ADD THIS LOG
        const userId = await User.create(username, email, passwordHash);

        console.log('User registered successfully:', userId); // <-- ADD THIS LOG
        res.status(201).json({ message: 'User registered successfully', userId });

    } catch (error) {
        console.error('CRITICAL ERROR DURING REGISTRATION:', error); // <-- MODIFIED LOG
        // Log the error object in detail
        if (error.stack) {
            console.error('Error Stack:', error.stack); // <-- ADD THIS LOG
        }
        if (error.message) {
            console.error('Error Message:', error.message); // <-- ADD THIS LOG
        }
        if (error.code) {
            console.error('Error Code:', error.code); // <-- ADD THIS LOG
        }

        if (error.code === 'ER_DUP_ENTRY') { // Catch duplicate entry errors for email
            return res.status(409).json({ message: 'Email already exists.' });
        }
        res.status(500).json({ message: 'Server error during registration.' });
    }
};

// Login function - also add similar detailed logging
exports.login = async (req, res) => {
    const { username, password } = req.body;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log('Validation errors (login):', errors.array()); // <-- ADD THIS LOG
        return res.status(400).json({ errors: errors.array() });
    }

    if (!username || !password) {
        console.log('Missing login credentials:', { username, password }); // <-- ADD THIS LOG
        return res.status(400).json({ message: 'Username and password are required.' });
    }

    try {
        console.log('Attempting to find user for login:', username); // <-- ADD THIS LOG
        const user = await User.findByUsername(username);
        if (!user) {
            console.log('User not found for login:', username); // <-- ADD THIS LOG
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        console.log('Comparing passwords...'); // <-- ADD THIS LOG
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            console.log('Password mismatch for user:', username); // <-- ADD THIS LOG
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        console.log('Signing JWT token for user:', user.user_id); // <-- ADD THIS LOG
        // Ensure JWT_SECRET is available in your Render environment variables!
        const token = jwt.sign({ userId: user.user_id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        console.log('Logged in successfully, sending response.'); // <-- ADD THIS LOG
        res.json({ message: 'Logged in successfully', token, user: { id: user.user_id, username: user.username } });

    } catch (error) {
        console.error('CRITICAL ERROR DURING LOGIN:', error); // <-- MODIFIED LOG
        if (error.stack) {
            console.error('Login Error Stack:', error.stack); // <-- ADD THIS LOG
        }
        if (error.message) {
            console.error('Login Error Message:', error.message); // <-- ADD THIS LOG
        }
        if (error.code) {
            console.error('Login Error Code:', error.code); // <-- ADD THIS LOG
        }
        res.status(500).json({ message: 'Server error during login.' });
    }
};