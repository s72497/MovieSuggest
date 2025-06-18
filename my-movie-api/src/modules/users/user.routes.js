// src/modules/users/user.routes.js

const express = require('express');
const { body, validationResult } = require('express-validator'); // Make sure validationResult is also imported
const authController = require('./auth.controller'); // Your controller file
const authMiddleware = require('../../middleware/authMiddleware'); // Your authentication middleware

const router = express.Router(); // This line initializes the router

// Register a new user
router.post('/register',
    [
        body('username')
            .notEmpty().withMessage('Username is required')
            .isLength({ min: 3 }).withMessage('Username must be at least 3 characters long'),
        body('email')
            .notEmpty().withMessage('Email is required')
            .isEmail().withMessage('Please enter a valid email address.')
            .normalizeEmail(),
        body('password')
            .notEmpty().withMessage('Password is required')
            .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
    ],
    authController.register
);

// Log in a user
router.post('/login', authController.login);

// --- NEW ROUTE: Get User Profile by ID ---
router.get(
    '/:userId', // e.g., /api/users/123
    authMiddleware, // Ensure the user is authenticated and authorized
    authController.getUserProfile
);

// --- NEW ROUTE: Update User Profile ---
router.put(
    '/:userId', // e.g., /api/users/123
    authMiddleware, // Ensure the user is authenticated and authorized
    [
        // Optional validation for fields being updated
        body('username')
            .optional() // Field is optional for update
            .trim()
            .notEmpty().withMessage('Username cannot be empty.')
            .isLength({ min: 3 }).withMessage('Username must be at least 3 characters long.'),
        body('email')
            .optional() // Field is optional for update
            .isEmail().withMessage('Please enter a valid email address.')
            .normalizeEmail(),
        body('password')
            .optional() // Field is optional for update
            .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long.')
            // No duplicate .withMessage() here
    ],
    authController.updateProfile
);

module.exports = router;