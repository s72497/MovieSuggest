// src/app.js
const express = require('express');
require('dotenv').config();
// const movieRoutes = require('./modules/movies/movie.routes'); // Keep commented out/removed
const userRoutes = require('./modules/users/user.routes');
// const interactionRoutes = require('./modules/interactions/interaction.routes'); // <--- THIS ONE IS BEING REPLACED, SO REMOVE ITS ORIGINAL MOUNT
const externalMovieDataRoutes = require('./modules/external_movie_data/external_movie_data.routes');
const watchlistRoutes = require('./modules/interactions/watchlist.routes'); // <--- ADD THIS IMPORT for new watchlist routes
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
// --- PHASE 4 MODIFICATION: CONFIGURE CORS ORIGIN ---
app.use(cors({
    origin: [
        'https://movie-suggest-frontend.onrender.com', // <--- YOUR DEPLOYED RENDER FRONTEND URL
        'http://localhost:5500', // Common for Live Server in VS Code
        'http://127.0.0.1:5500', // Another common Live Server address
        'http://localhost:8080' // Another common local dev port
        // Add any other specific local development URLs if you use them
    ]
}));
// --- END PHASE 4 MODIFICATION ---

// Mount your API routes
app.use('/api/users', userRoutes);
app.use('/api/external-movies', externalMovieDataRoutes);
app.use('/api/watchlist', watchlistRoutes); // <--- ADD THIS LINE FOR YOUR NEW WATCHLIST ROUTES

// Basic route for testing
app.get('/', (req, res) => {
    res.send('Welcome to the Movie System API!');
});

// Global error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    require('./config/db');
});
