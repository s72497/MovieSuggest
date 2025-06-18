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

// Get User Profile function
exports.getUserProfile = async (req, res) => {
    const { userId } = req.params; // Get userId from URL parameter
    const authenticatedUserId = req.user.userId; // User ID from the JWT token

    // Optional: Ensure the user is trying to access their own profile
    // It's good practice for security.
    if (parseInt(userId) !== authenticatedUserId) {
        console.log(`Unauthorized attempt to access profile: Token ID ${authenticatedUserId}, Requested ID ${userId}`);
        return res.status(403).json({ message: 'Unauthorized access to this profile.' });
    }

    try {
        // Assuming you have a User model with a findById method
        const user = await User.findById(userId); // Fetch user details from database

        if (!user) {
            console.log(`User not found for profile: ${userId}`);
            return res.status(404).json({ message: 'User not found.' });
        }

        // Exclude sensitive information like password hash from the response
        const { password_hash, ...userData } = user;
        res.json({ message: 'User profile fetched successfully', user: userData });

    } catch (error) {
        console.error('CRITICAL ERROR FETCHING USER PROFILE:', error);
        if (error.stack) {
            console.error('Profile Error Stack:', error.stack);
        }
        res.status(500).json({ message: 'Server error fetching user profile.' });
    }
};

// Update User Profile function
exports.updateProfile = async (req, res) => {
    const { userId } = req.params;
    const { username, email, password } = req.body;
    const authenticatedUserId = req.user.userId; // User ID from the JWT token

    // Optional: Ensure the user is trying to update their own profile
    if (parseInt(userId) !== authenticatedUserId) {
        console.log(`Unauthorized attempt to update profile: Token ID ${authenticatedUserId}, Requested ID ${userId}`);
        return res.status(403).json({ message: 'Unauthorized to update this profile.' });
    }

    const errors = validationResult(req); // Check validation results from user.routes.js
    if (!errors.isEmpty()) {
        console.log('Validation errors (updateProfile):', errors.array());
        return res.status(400).json({ errors: errors.array() });
    }

    const updateFields = {};
    if (username !== undefined && username !== null) updateFields.username = username;
    if (email !== undefined && email !== null) updateFields.email = email;

    if (password) {
        try {
            const salt = await bcrypt.genSalt(10);
            updateFields.password_hash = await bcrypt.hash(password, salt);
        } catch (hashError) {
            console.error('Error hashing new password:', hashError);
            return res.status(500).json({ message: 'Error processing password.' });
        }
    }

    if (Object.keys(updateFields).length === 0) {
        return res.status(400).json({ message: 'No fields provided for update.' });
    }

    try {
        // Assuming you have a User model with an update method
        const success = await User.update(userId, updateFields);

        if (!success) {
            console.log(`User not found or no changes made for update: ${userId}`);
            return res.status(404).json({ message: 'User not found or no changes made.' });
        }

        res.json({ message: 'User updated successfully!' });

    } catch (error) {
        console.error('CRITICAL ERROR UPDATING USER PROFILE:', error);
        if (error.stack) {
            console.error('Update Profile Error Stack:', error.stack);
        }
        if (error.code === 'ER_DUP_ENTRY') { // Catch duplicate entry errors for unique fields (username/email)
            console.error('Duplicate entry error during profile update:', error.message);
            return res.status(409).json({ message: 'Username or email already exists.' });
        }
        res.status(500).json({ message: 'Server error updating profile.' });
    }
};