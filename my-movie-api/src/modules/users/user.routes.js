// src/modules/users/user.routes.js

// ... (your existing register and login routes) ...

// --- NEW ROUTE: Get User Profile by ID ---
router.get(
    '/:userId', // e.g., /api/users/123
    authMiddleware, // Ensure the user is authenticated and authorized
    authController.getUserProfile
);

// --- NEW ROUTE: Update User Profile ---
// router.put(  // <--- COMMENT OUT OR DELETE THIS ENTIRE BLOCK TEMPORARILY
//     '/:userId', // e.g., /api/users/123
//     authMiddleware, // Ensure the user is authenticated and authorized
//     [
//         // Optional validation for fields being updated
//         body('username')
//             .optional() // Field is optional for update
//             .trim()
//             .notEmpty().withMessage('Username cannot be empty.')
//             .isLength({ min: 3 }).withMessage('Username must be at least 3 characters long.'),
//         body('email')
//             .optional() // Field is optional for update
//             .isEmail().withMessage('Please enter a valid email address.')
//             .normalizeEmail(),
//         body('password')
//             .optional() // Field is optional for update
//             .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long.')
//     ],
//     authController.updateProfile
// );

module.exports = router;