// src/modules/users/auth.controller.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./user.model'); // Your user model
const { validationResult } = require('express-validator'); // For input validation

// Register function (existing)
exports.register = async (req, res) => {
    const { username, email, password } = req.body;

    // Validation check (from express-validator, if used in route)
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    if (!username || !email || !password) { // Basic check if express-validator isn't used
        return res.status(400).json({ message: 'All fields are required.' });
    }

    try {
        const existingUser = await User.findByUsername(username);
        if (existingUser) {
            return res.status(409).json({ message: 'Username already exists.' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const userId = await User.create(username, email, passwordHash);

        res.status(201).json({ message: 'User registered successfully', userId });

    } catch (error) {
        console.error('Error during registration:', error);
        if (error.code === 'ER_DUP_ENTRY') { // Catch duplicate entry errors for email
            return res.status(409).json({ message: 'Email already exists.' });
        }
        res.status(500).json({ message: 'Server error during registration.' });
    }
};

// Login function (existing)
exports.login = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
    }

    try {
        const user = await User.findByUsername(username);
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        const token = jwt.sign(
            { id: user.user_id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({ message: 'Logged in successfully', token, user: { id: user.user_id, username: user.username } });

    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Server error during login.' });
    }
};

// --- NEW FUNCTION: Get User Profile by ID ---
exports.getUserProfile = async (req, res) => {
    const userId = parseInt(req.params.userId, 10);
    const authenticatedUserId = req.user.id; // User ID from JWT token

    // Authorization check: User can only access their own profile
    if (userId !== authenticatedUserId) {
        return res.status(403).json({ message: 'Forbidden: You can only view your own profile.' });
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Return user data, but explicitly omit sensitive info like password_hash
        res.json({
            id: user.user_id,
            username: user.username,
            email: user.email,
            created_at: user.created_at,
            updated_at: user.updated_at
        });

    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ message: 'Server error: Could not retrieve user profile.' });
    }
};

// --- NEW FUNCTION: Update User Profile ---
exports.updateUser = async (req, res) => {
    const userIdToUpdate = parseInt(req.params.userId, 10); // User ID from URL parameter
    const { username, email, password } = req.body; // Fields to update from request body
    const authenticatedUserId = req.user.id; // User ID from the JWT token (from authMiddleware)

    // Validation check (from express-validator, if used in route)
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    // Authorization Check: A user can only update their own profile
    if (userIdToUpdate !== authenticatedUserId) {
        return res.status(403).json({ message: 'Forbidden: You can only update your own profile.' });
    }

    let passwordHash = null;
    if (password) {
        // If password is provided, hash it before updating
        const salt = await bcrypt.genSalt(10); // Use the same salt rounds as your register function
        passwordHash = await bcrypt.hash(password, salt);
    }

    // Prepare update fields dynamically
    const updateFields = {};
    if (username !== undefined) updateFields.username = username; // Allow empty string if intended
    if (email !== undefined) updateFields.email = email;
    if (passwordHash) updateFields.password_hash = passwordHash;

    // Ensure there's something to update
    if (Object.keys(updateFields).length === 0) {
        return res.status(400).json({ message: 'No fields provided for update.' });
    }

    try {
        const success = await User.update(userIdToUpdate, updateFields);

        if (!success) {
            return res.status(404).json({ message: 'User not found or no changes made.' });
        }

        res.json({ message: 'User updated successfully!' });
    } catch (error) {
        console.error('Error updating user:', error);
        if (error.code === 'ER_DUP_ENTRY') { // Catch duplicate entry errors for username/email
            // Check if the duplicate is for username or email specifically
            if (error.message.includes('username')) {
                 return res.status(409).json({ message: 'Username already exists.' });
            } else if (error.message.includes('email')) {
                 return res.status(409).json({ message: 'Email already exists.' });
            }
            return res.status(409).json({ message: 'Duplicate entry detected (username or email might already exist).' });
        }
        res.status(500).json({ message: 'Server error: Could not update user.' });
    }
};