// src/modules/external_movie_data/external_movie_data.controller.js
const axios = require('axios');
require('dotenv').config();

const OMDB_API_KEY = process.env.OMDB_API_KEY;
const TMDB_API_KEY = process.env.TMDB_API_KEY;

// Existing function for OMDB search
exports.searchMoviesByTitle = async (req, res) => {
    const { title } = req.query;

    if (!title) {
        return res.status(400).json({ message: 'Movie title is required for search.' });
    }

    try {
        const omdbUrl = `http://www.omdbapi.com/?s=${encodeURIComponent(title)}&apikey=${OMDB_API_KEY}`;
        const response = await axios.get(omdbUrl);

        if (response.data.Response === 'True') {
            res.json(response.data.Search);
        } else {
            res.status(404).json({ message: response.data.Error || 'Movie not found.' });
        }
    } catch (error) {
        console.error('Error searching OMDB:', error.message);
        res.status(500).json({ message: 'Server error while fetching movie data.' });
    }
};

// --- NEW TMDB FUNCTIONS (Existing from previous steps) ---

// Function to get movie genres from TMDB
exports.getMovieGenres = async (req, res) => {
    try {
        const tmdbUrl = `https://api.themoviedb.org/3/genre/movie/list?api_key=${TMDB_API_KEY}`;
        const response = await axios.get(tmdbUrl);

        if (response.data && response.data.genres) {
            res.json(response.data.genres);
        } else {
            res.status(500).json({ message: 'Failed to fetch genres from TMDB.' });
        }
    } catch (error) {
        console.error('Error fetching TMDB genres:', error.message);
        res.status(500).json({ message: 'Server error while fetching movie genres.' });
    }
};

// Function to discover movies by genre from TMDB
exports.discoverMoviesByGenre = async (req, res) => {
    const { genre_id } = req.query;
    const page = parseInt(req.query.page) || 1;

    if (!genre_id) {
        return res.status(400).json({ message: 'Genre ID is required for genre search.' });
    }

    try {
        const tmdbUrl = `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&with_genres=${encodeURIComponent(genre_id)}&page=${page}`;
        const response = await axios.get(tmdbUrl);

        if (response.data && response.data.results) {
            res.json({
                page: response.data.page,
                total_pages: response.data.total_pages,
                total_results: response.data.total_results,
                results: response.data.results
            });
        } else {
            res.status(404).json({ message: 'No movies found for the specified genre.' });
        }
    } catch (error) {
        console.error('Error discovering TMDB movies by genre:', error.message);
        res.status(500).json({ message: 'Server error while discovering movie data by genre.' });
    }
};

// --- NEW TMDB & OMDB DETAIL FUNCTIONS (ADD THESE) ---

exports.getMovieDetailsOmdb = async (req, res) => {
    const { imdbId } = req.params; // Expecting IMDb ID from URL parameter (e.g., tt1234567)

    if (!imdbId) {
        return res.status(400).json({ message: 'IMDb ID is required to fetch movie details.' });
    }

    try {
        const omdbUrl = `http://www.omdbapi.com/?i=${encodeURIComponent(imdbId)}&apikey=${OMDB_API_KEY}`;
        const response = await axios.get(omdbUrl);

        if (response.data.Response === 'True') {
            res.json(response.data); // OMDB returns single movie details directly
        } else {
            res.status(404).json({ message: response.data.Error || 'Movie details not found on OMDB.' });
        }
    } catch (error) {
        console.error('Error fetching OMDB movie details:', error.message);
        res.status(500).json({ message: 'Server error while fetching movie details from OMDB.' });
    }
};

exports.getMovieDetailsTmdb = async (req, res) => {
    const { tmdbId } = req.params; // Expecting TMDB ID from URL parameter (e.g., 12345)

    if (!tmdbId) {
        return res.status(400).json({ message: 'TMDB ID is required to fetch movie details.' });
    }

    try {
        const tmdbUrl = `https://api.themoviedb.org/3/movie/${encodeURIComponent(tmdbId)}?api_key=${TMDB_API_KEY}`;
        const response = await axios.get(tmdbUrl);

        if (response.data) {
            res.json(response.data); // TMDB returns single movie details directly
        } else {
            res.status(404).json({ message: 'Movie details not found on TMDB.' });
        }
    } catch (error) {
        console.error('Error fetching TMDB movie details:', error.message);
        res.status(500).json({ message: 'Server error while fetching movie details from TMDB.' });
    }
};