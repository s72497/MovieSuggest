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
        console.log('Validation errors (register):', errors.array());
        return res.status(400).json({ errors: errors.array() });
    }

    // Basic check if express-validator isn't fully comprehensive for some reason
    if (!username || !email || !password) {
        console.log('Missing fields (register):', { username, email, password });
        return res.status(400).json({ message: 'All fields are required.' });
    }

    try {
        console.log('Attempting to find user by username (register):', username);
        const existingUser = await User.findByUsername(username);
        if (existingUser) {
            console.log('Username already exists (register):', username);
            return res.status(409).json({ message: 'Username already exists.' });
        }

        console.log('Attempting to find user by email (register):', email);
        const existingEmailUser = await User.findByEmail(email); // Also check for existing email
        if (existingEmailUser) {
            console.log('Email already exists (register):', email);
            return res.status(409).json({ message: 'Email already exists.' });
        }

        console.log('Generating salt and hashing password (register)...');
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        console.log('Creating user in database (register)...');
        const userId = await User.create(username, email, passwordHash);

        console.log('User registered successfully (register), userId:', userId);
        res.status(201).json({ message: 'User registered successfully', userId });

    } catch (error) {
        console.error('CRITICAL ERROR DURING REGISTRATION:', error);
        if (error.stack) {
            console.error('Register Error Stack:', error.stack);
        }
        res.status(500).json({ message: 'Server error during registration.' });
    }
};

// Log in function
exports.login = async (req, res) => {
    const { username, password } = req.body;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log('Validation errors (login):', errors.array());
        return res.status(400).json({ errors: errors.array() });
    }

    if (!username || !password) {
        console.log('Missing fields (login):', { username, password });
        return res.status(400).json({ message: 'Username and password are required.' });
    }

    try {
        console.log('Attempting to find user by username (login):', username);
        const user = await User.findByUsername(username);
        if (!user) {
            console.log('User not found (login) for username:', username);
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        console.log('Comparing passwords (login)...');
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            console.log('Password mismatch (login) for user:', username);
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        console.log('Signing JWT token (login) for user:', user.user_id);
        const token = jwt.sign({ userId: user.user_id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });

        console.log('Logged in successfully, sending response.');
        res.json({ message: 'Logged in successfully', token, user: { id: user.user_id, username: user.username } });

    } catch (error) {
        console.error('CRITICAL ERROR DURING LOGIN:', error);
        if (error.stack) {
            console.error('Login Error Stack:', error.stack);
        }
        res.status(500).json({ message: 'Server error during login.' });
    }
};

// Get User Profile function
exports.getUserProfile = async (req, res) => {
    const { userId } = req.params; // Get userId from URL parameter
    // req.user.userId comes from authMiddleware, which attaches the decoded JWT payload
    const authenticatedUserId = req.user.userId;

    // Log for debugging
    console.log(`[GET PROFILE] Attempting to get profile for userId: ${userId}, Authenticated User ID: ${authenticatedUserId}`);


    // Ensure the user is trying to access their own profile (security check)
    // IMPORTANT: Ensure userId from params is parsed to an integer if your database stores it as number
    if (parseInt(userId, 10) !== authenticatedUserId) {
        console.log(`[GET PROFILE] Unauthorized attempt to access profile: Token ID ${authenticatedUserId}, Requested ID ${userId}`);
        return res.status(403).json({ message: 'Unauthorized access to this profile.' });
    }

    try {
        // Assuming you have a User model with a findById method
        const user = await User.findById(userId); // Fetch user details from database

        if (!user) {
            console.log(`[GET PROFILE] User not found for profile: ${userId}`);
            return res.status(404).json({ message: 'User not found.' });
        }

        // Exclude sensitive information like password hash from the response
        const { password_hash, ...userData } = user;
        console.log(`[GET PROFILE] Successfully fetched profile for user: ${userId}`);
        res.json({ message: 'User profile fetched successfully', user: userData });

    } catch (error) {
        console.error('[GET PROFILE] CRITICAL ERROR FETCHING USER PROFILE:', error);
        if (error.stack) {
            console.error('[GET PROFILE] Profile Error Stack:', error.stack);
        }
        res.status(500).json({ message: 'Server error fetching user profile.' });
    }
};

// Update User Profile function
exports.updateProfile = async (req, res) => {
    const { userId } = req.params;
    const { username, email, password } = req.body;
    // req.user.userId comes from authMiddleware
    const authenticatedUserId = req.user.userId;

    // Log for debugging
    console.log(`[UPDATE PROFILE] Attempting to update profile for userId: ${userId}, Authenticated User ID: ${authenticatedUserId}`);


    // Ensure the user is trying to update their own profile (security check)
    if (parseInt(userId, 10) !== authenticatedUserId) {
        console.log(`[UPDATE PROFILE] Unauthorized attempt to update profile: Token ID ${authenticatedUserId}, Requested ID ${userId}`);
        return res.status(403).json({ message: 'Unauthorized to update this profile.' });
    }

    const errors = validationResult(req); // Check validation results from user.routes.js
    if (!errors.isEmpty()) {
        console.log('[UPDATE PROFILE] Validation errors:', errors.array());
        return res.status(400).json({ errors: errors.array() });
    }

    const updateFields = {};
    // Only add fields if they are actually provided in the request body
    // Using !== undefined to allow empty strings if that's a valid update
    if (username !== undefined) updateFields.username = username;
    if (email !== undefined) updateFields.email = email;

    if (password) {
        try {
            const salt = await bcrypt.genSalt(10);
            updateFields.password_hash = await bcrypt.hash(password, salt);
            console.log('[UPDATE PROFILE] Password hashed successfully.');
        } catch (hashError) {
            console.error('[UPDATE PROFILE] Error hashing new password:', hashError);
            return res.status(500).json({ message: 'Error processing password.' });
        }
    }

    if (Object.keys(updateFields).length === 0) {
        console.log('[UPDATE PROFILE] No fields provided for update.');
        return res.status(400).json({ message: 'No fields provided for update.' });
    }

    try {
        // Assuming you have a User model with an update method
        const success = await User.update(userId, updateFields);

        if (!success) {
            console.log(`[UPDATE PROFILE] User not found or no changes made for update: ${userId}`);
            return res.status(404).json({ message: 'User not found or no changes made.' });
        }

        console.log(`[UPDATE PROFILE] User ${userId} updated successfully!`);
        res.json({ message: 'User updated successfully!' });

    } catch (error) {
        console.error('[UPDATE PROFILE] CRITICAL ERROR UPDATING USER PROFILE:', error);
        if (error.stack) {
            console.error('[UPDATE PROFILE] Update Profile Error Stack:', error.stack);
        }
        if (error.code === 'ER_DUP_ENTRY') { // Catch duplicate entry errors for unique fields (username/email)
            console.error('[UPDATE PROFILE] Duplicate entry error during profile update:', error.message);
            return res.status(409).json({ message: 'Username or email already exists.' });
        }
        res.status(500).json({ message: 'Server error updating profile.' });
    }
};