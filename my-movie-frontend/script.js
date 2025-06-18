// my-movie-frontend/script.js

// --- Configuration ---
const API_BASE_URL = 'https://movie-suggest-api.onrender.com'; // Your backend API base URL

// --- DOM Elements ---
const authSection = document.getElementById('auth-section');
const movieSearchSection = document.getElementById('movie-search-section');
const watchlistSection = document.getElementById('watchlist-section');

const registerBtn = document.getElementById('registerBtn');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const welcomeMessage = document.getElementById('welcomeMessage');
const profileBtn = document.getElementById('profileBtn'); // Profile button

const authForm = document.getElementById('authForm');
const usernameInput = document.getElementById('username');
const emailInput = document.getElementById('email'); // Email input for register/login form
const passwordInput = document.getElementById('password');
const submitAuthBtn = document.getElementById('submitAuth');
const authMessage = document.getElementById('authMessage');

// Movie search DOM elements
const movieSearchInput = document.getElementById('movieSearchInput');
const searchMovieBtn = document.getElementById('searchMovieBtn');
const genreSelect = document.getElementById('genreSelect');
const discoverGenreBtn = document.getElementById('discoverGenreBtn');
const movieResultsDiv = document.getElementById('movieResults');

// Watchlist DOM elements
const viewWatchlistBtn = document.getElementById('viewWatchlistBtn');
const watchlistResultsDiv = document.getElementById('watchlistResults');
const backToMoviesBtn = document.getElementById('backToMoviesBtn'); // Back to Movies button (from watchlist)

// Profile Management DOM elements
const profileManagementSection = document.getElementById('profile-management-section');
const profileDetailsDiv = document.getElementById('profileDetails');
const profileUsernameDisplay = document.getElementById('profileUsernameDisplay');
const profileEmailDisplay = document.getElementById('profileEmailDisplay');
const editProfileBtn = document.getElementById('editProfileBtn');
const profileEditForm = document.getElementById('profileEditForm');
const editUsernameInput = document.getElementById('editUsername');
const editEmailInput = document.getElementById('editEmail');
const newPasswordInput = document.getElementById('newPassword');
const confirmNewPasswordInput = document.getElementById('confirmNewPassword');
const saveProfileBtn = document.getElementById('saveProfileBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const profileMessage = document.getElementById('profileMessage');
const backToMoviesFromProfileBtn = document.getElementById('backToMoviesFromProfileBtn'); // Back to Movies from Profile button




// --- State Variables ---
let currentAuthMode = 'login'; // 'login' or 'register'

// --- Utility Functions ---

/**
 * Saves authentication data (JWT token, user ID, username) to localStorage
 * and updates the UI based on authentication status.
 * @param {string} token - The JWT token received from the backend.
 * @param {string} userId - The ID of the authenticated user.
 * @param {string} username - The username of the authenticated user.
 */
function saveAuthData(token, userId, username) {
    localStorage.setItem('jwtToken', token);
    localStorage.setItem('userId', userId);
    localStorage.setItem('username', username);
    updateUIForAuth(true, username);
}

/**
 * Retrieves the JWT token from localStorage.
 * @returns {string|null} The JWT token or null if not found.
 */
function getAuthToken() {
    return localStorage.getItem('jwtToken');
}

/**
 * Retrieves the user ID from localStorage.
 * @returns {string|null} The user ID or null if not found.
 */
function getUserId() {
    return localStorage.getItem('userId');
}

/**
 * Retrieves the username from localStorage.
 * @returns {string|null} The username or null if not found.
 */
function getUsername() {
    return localStorage.getItem('username');
}

/**
 * Clears all authentication data from localStorage and updates the UI.
 */
function clearAuthData() {
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    updateUIForAuth(false);
}

/**
 * Updates the visibility of various UI sections and buttons based on authentication status.
 * @param {boolean} isAuthenticated - True if a user is logged in, false otherwise.
 * @param {string} [username=''] - The username of the logged-in user.
 */
function updateUIForAuth(isAuthenticated, username = '') {
    if (isAuthenticated) {
        // Show sections for logged-in users
        authSection.style.display = 'none';
        movieSearchSection.style.display = 'block'; // Default to movie search section
        watchlistSection.style.display = 'none';
        profileManagementSection.style.display = 'none'; // Profile section initially hidden

        // Update button visibility
        registerBtn.style.display = 'none';
        loginBtn.style.display = 'none';
        logoutBtn.style.display = 'inline-block';
        welcomeMessage.textContent = `Welcome, ${username}!`;
        welcomeMessage.style.display = 'inline-block';
        profileBtn.style.display = 'inline-block'; // Show profile button

        // Load genres for movie search (if not already loaded)
        loadGenres();

    } else {
        // Show sections for logged-out users
        authSection.style.display = 'block';
        movieSearchSection.style.display = 'none';
        watchlistSection.style.display = 'none';
        profileManagementSection.style.display = 'none'; // Hide profile section on logout

        // Update button visibility
        registerBtn.style.display = 'inline-block';
        loginBtn.style.display = 'inline-block';
        logoutBtn.style.display = 'none';
        welcomeMessage.style.display = 'none';
        welcomeMessage.textContent = '';
        profileBtn.style.display = 'none'; // Hide profile button

        // Clear auth-related messages and inputs
        authMessage.textContent = '';
        usernameInput.value = '';
        emailInput.value = ''; // Clear email input on logout
        passwordInput.value = '';

        // Clear movie and watchlist results
        movieResultsDiv.innerHTML = '';
        watchlistResultsDiv.innerHTML = '';
        genreSelect.innerHTML = '<option value="">Select a Genre</option>';
    }
}

/**
 * Sends authentication requests (register or login) to the backend API.
 * @param {string} endpoint - The API endpoint ('register' or 'login').
 * @param {object} dataPayload - The data to send (e.g., { username, password, email? }).
 */
async function sendAuthRequest(endpoint, dataPayload) {
    try {
        const response = await fetch(`${API_BASE_URL}/users/${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataPayload)
        });

        const data = await response.json();

        if (response.ok) {
            authMessage.textContent = data.message || `${endpoint} successful!`;
            authMessage.style.color = 'green';
            if (endpoint === 'login' && data.token) {
                saveAuthData(data.token, data.user.id, dataPayload.username);
            } else if (endpoint === 'register') {
                authMessage.textContent += " Please login now.";
                currentAuthMode = 'login';
                submitAuthBtn.textContent = 'Login';
                // Clear inputs after successful registration
                usernameInput.value = '';
                emailInput.value = '';
                passwordInput.value = '';
            }
        } else {
            authMessage.textContent = data.message || (data.errors && data.errors[0] ? data.errors[0].msg : `Error during ${endpoint}.`);
            authMessage.style.color = 'red';
            console.error(`Error during ${endpoint}:`, data);
        }
    } catch (error) {
        console.error(`Network error during ${endpoint}:`, error);
        authMessage.textContent = `Network error: Could not connect to the server for ${endpoint}.`;
        authMessage.style.color = 'red';
    }
}

/**
 * A wrapper function for fetch that includes the JWT token in the Authorization header.
 * Handles 401/403 responses by clearing auth data and alerting the user.
 * @param {string} url - The URL to fetch.
 * @param {object} [options={}] - Fetch options.
 * @returns {Promise<Response|null>} The fetch Response object or null if not authenticated/network error.
 */
async function authenticatedFetch(url, options = {}) {
    const token = getAuthToken();
    if (!token) {
        alert('You must be logged in to perform this action.');
        clearAuthData();
        return null;
    }

    const headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`
    };

    try {
        const response = await fetch(url, { ...options, headers });
        if (response.status === 401 || response.status === 403) {
            alert('Your session has expired or you are not authorized. Please log in again.');
            clearAuthData();
            return null;
        }
        return response;
    } catch (error) {
        console.error('Authenticated fetch error:', error);
        alert('Network error or API is unreachable.');
        return null;
    }
}

// --- Movie Search Functions ---

/**
 * Loads movie genres from the TMDB API via the backend proxy and populates the genre dropdown.
 */
async function loadGenres() {
    const response = await authenticatedFetch(`${API_BASE_URL}/external-movies/genres`);
    if (response && response.ok) {
        const genres = await response.json();
        genreSelect.innerHTML = '<option value="">Select a Genre</option>';
        genres.forEach(genre => {
            const option = document.createElement('option');
            option.value = genre.id;
            option.textContent = genre.name;
            genreSelect.appendChild(option);
        });
    } else if (response) {
        const errorData = await response.json();
        console.error('Failed to load genres:', errorData);
    }
}

/**
 * Searches movies by title using the OMDB API via the backend proxy and displays results.
 * @param {string} title - The movie title to search for.
 */
async function searchMoviesByTitle(title) {
    if (!title) {
        movieResultsDiv.innerHTML = '<p>Please enter a movie title to search.</p>';
        return;
    }
    movieResultsDiv.innerHTML = '<p>Searching...</p>';
    const response = await authenticatedFetch(`${API_BASE_URL}/external-movies/search?title=${encodeURIComponent(title)}`);
    if (response && response.ok) {
        const movies = await response.json();
        displayMovies(movies);
    } else if (response) {
        const errorData = await response.json();
        movieResultsDiv.innerHTML = `<p class="error-message">Error: ${errorData.message || 'Could not fetch movies.'}</p>`;
        console.error('Error searching movies by title:', errorData);
    }
}

/**
 * Discovers movies by genre using the TMDB API via the backend proxy and displays results.
 * @param {string} genreId - The TMDB genre ID to discover movies for.
 */
async function discoverMoviesByGenre(genreId) {
    if (!genreId) {
        movieResultsDiv.innerHTML = '<p>Please select a genre to discover movies.</p>';
        return;
    }
    movieResultsDiv.innerHTML = '<p>Discovering movies...</p>';
    const response = await authenticatedFetch(`${API_BASE_URL}/external-movies/discover?genre_id=${encodeURIComponent(genreId)}`);
    if (response && response.ok) {
        const data = await response.json();
        displayMovies(data.results);
    } else if (response) {
        const errorData = await response.json();
        movieResultsDiv.innerHTML = `<p class="error-message">Error: ${errorData.message || 'Could not discover movies by genre.'}</p>`;
        console.error('Error discovering movies by genre:', errorData);
    }
}

/**
 * Displays an array of movie objects in the movieResultsDiv.
 * Includes "Add to Watchlist" button for each.
 * @param {Array<object>} movies - An array of movie objects.
 */
function displayMovies(movies) {
    movieResultsDiv.innerHTML = '';
    if (!movies || movies.length === 0) {
        movieResultsDiv.innerHTML = '<p>No movies found.</p>';
        return;
    }

    movies.forEach(movie => {
        const movieItem = document.createElement('div');
        movieItem.classList.add('movie-item');

        const moviePoster = movie.Poster && movie.Poster !== 'N/A' ? movie.Poster : (movie.poster_path ? `https://image.tmdb.org/t/p/w200${movie.poster_path}` : 'https://via.placeholder.com/100x150?text=No+Poster');
        const movieTitle = movie.Title || movie.title;
        const movieYear = movie.Year || (movie.release_date ? movie.release_date.substring(0, 4) : 'N/A');
        const movieId = movie.imdbID || movie.id; // Use OMDB ID (imdbID) or TMDB ID (id)

        movieItem.innerHTML = `
            <img src="${moviePoster}" alt="${movieTitle} Poster">
            <div>
                <h3>${movieTitle} (${movieYear})</h3>
                <p>ID: ${movieId}</p>
                <button class="add-to-watchlist-btn" data-movie-id="${movieId}">Add to Watchlist</button>
            </div>
        `;
        movieResultsDiv.appendChild(movieItem);
    });
}

// --- Watchlist Functions ---

/**
 * Adds a movie to the user's watchlist in the backend.
 * @param {string} movieId - The external API ID (OMDB/TMDB) of the movie to add.
 */
async function addMovieToWatchlist(movieId) {
    const userId = getUserId();
    if (!userId) {
        alert('User ID not found. Please log in again.');
        clearAuthData();
        return;
    }

    const response = await authenticatedFetch(`${API_BASE_URL}/watchlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ movie_api_id: movieId })
    });

    if (response && response.ok) {
        const data = await response.json();
        alert('Movie added to watchlist successfully!');
        console.log('Watchlist add response:', data);
    } else if (response) {
        const errorData = await response.json();
        alert(`Error adding movie to watchlist: ${errorData.message || 'Unknown error'}`);
        console.error('Error adding movie to watchlist:', errorData);
    }
}

/**
 * Fetches and displays the current user's watchlist from the backend.
 * Also fetches full movie details for each watchlist item.
 */
async function viewMyWatchlist() {
    const userId = getUserId();
    if (!userId) {
        alert('User ID not found. Please log in.');
        clearAuthData();
        return;
    }

    console.log('Attempting to view watchlist for userId:', userId);

    watchlistResultsDiv.innerHTML = '<p>Loading watchlist...</p>';
    const response = await authenticatedFetch(`${API_BASE_URL}/watchlist/users/${userId}`);

    if (response && response.ok) {
        const watchlistItems = await response.json();
        console.log('Watchlist items fetched:', watchlistItems);

        if (!watchlistItems || watchlistItems.length === 0) {
            watchlistResultsDiv.innerHTML = '<p>Your watchlist is empty.</p>';
            return;
        }

        // Fetch full movie details for each item in the watchlist
        const movieDetailsPromises = watchlistItems.map(async item => {
            const movieApiId = item.movie_api_id;
            // Determine if it's an OMDB ID (starts with 'tt') or TMDB ID
            const detailEndpoint = movieApiId.startsWith('tt') ? 'details/omdb' : 'details/tmdb';
            try {
                const movieDetailResponse = await authenticatedFetch(`${API_BASE_URL}/external-movies/${detailEndpoint}/${movieApiId}`);
                if (movieDetailResponse && movieDetailResponse.ok) {
                    const movieData = await movieDetailResponse.json();
                    return { ...movieData, watchlist_id: item.id }; // Attach the watchlist item's ID for removal
                } else {
                    console.error(`Failed to fetch details for movie ID ${movieApiId}:`, movieDetailResponse ? await movieDetailResponse.json() : 'Network error');
                    return { error: `Failed to load details for ID: ${movieApiId}`, watchlist_id: item.id };
                }
            } catch (error) {
                console.error(`Exception fetching details for movie ID ${movieApiId}:`, error);
                return { error: `Network error for ID: ${movieApiId}`, watchlist_id: item.id };
            }
        });

        const detailedWatchlist = await Promise.all(movieDetailsPromises);
        displayWatchlistItems(detailedWatchlist);

    } else if (response) {
        const errorData = await response.json();
        watchlistResultsDiv.innerHTML = `<p class="error-message">Error loading watchlist: ${errorData.message || 'Unknown error'}</p>`;
        console.error('Error loading watchlist:', errorData);
    }
}

/**
 * Removes a movie from the user's watchlist in the backend.
 * @param {number} watchlistId - The ID of the watchlist entry to remove (from your DB, not external API ID).
 */
async function removeMovieFromWatchlist(watchlistId) {
    // Using custom dialog instead of alert for better UX, but keeping alert for consistency for now
    if (!confirm('Are you sure you want to remove this movie from your watchlist?')) {
        return;
    }

    const response = await authenticatedFetch(`${API_BASE_URL}/watchlist/${watchlistId}`, {
        method: 'DELETE'
    });

    if (response && response.ok) {
        const data = await response.json();
        alert('Movie removed from watchlist successfully!');
        console.log('Watchlist remove response:', data);
        viewMyWatchlist(); // Refresh the watchlist after removal
    } else if (response) {
        const errorData = await response.json();
        alert(`Error removing movie from watchlist: ${errorData.message || 'Unknown error'}`);
        console.error('Error removing movie from watchlist:', errorData);
    }
}

/**
 * Displays an array of detailed watchlist movie objects in the watchlistResultsDiv.
 * Includes "Remove from Watchlist" button for each.
 * @param {Array<object>} detailedWatchlist - An array of movie objects with watchlist_id.
 */
function displayWatchlistItems(detailedWatchlist) {
    watchlistResultsDiv.innerHTML = '';
    if (!detailedWatchlist || detailedWatchlist.length === 0) {
        watchlistResultsDiv.innerHTML = '<p>Your watchlist is empty.</p>';
        return;
    }

    detailedWatchlist.forEach(movie => {
        if (movie.error) {
            const errorItem = document.createElement('div');
            errorItem.classList.add('movie-item', 'error-item');
            errorItem.innerHTML = `<p>${movie.error} (Watchlist ID: ${movie.watchlist_id})</p>
                                   <button class="remove-from-watchlist-btn" data-watchlist-id="${movie.watchlist_id}">Remove</button>`;
            watchlistResultsDiv.appendChild(errorItem);
            return;
        }

        const movieItem = document.createElement('div');
        movieItem.classList.add('movie-item');

        const moviePoster = movie.Poster && movie.Poster !== 'N/A' ? movie.Poster : (movie.poster_path ? `https://image.tmdb.org/t/p/w200${movie.poster_path}` : 'https://via.placeholder.com/100x150?text=No+Poster');
        const movieTitle = movie.Title || movie.title;
        const movieYear = movie.Year || (movie.release_date ? movie.release_date.substring(0, 4) : 'N/A');

        movieItem.innerHTML = `
            <img src="${moviePoster}" alt="${movieTitle} Poster">
            <div>
                <h3>${movieTitle} (${movieYear})</h3>
                <button class="remove-from-watchlist-btn" data-watchlist-id="${movie.watchlist_id}">Remove from Watchlist</button>
            </div>
        `;
        watchlistResultsDiv.appendChild(movieItem);
    });
}


// --- Profile Management Functions ---

/**
 * Hides all main content sections and displays only the specified one.
 * @param {string} sectionId - The ID of the section to display (e.g., 'auth-section', 'movie-search-section').
 */
function showSection(sectionId) {
    const sections = [authSection, movieSearchSection, watchlistSection, profileManagementSection];
    sections.forEach(section => {
        if (section.id === sectionId) {
            section.style.display = 'block';
        } else {
            section.style.display = 'none';
        }
    });
}

/**
 * Fetches the current user's profile data from the backend and displays it.
 */
async function loadUserProfile() {
    const userId = getUserId();
    if (!userId) {
        alert('User ID not found. Please log in.');
        clearAuthData();
        return;
    }

    profileMessage.textContent = 'Loading profile...';
    profileMessage.style.color = 'blue';

    const response = await authenticatedFetch(`${API_BASE_URL}/users/${userId}`);

    if (response && response.ok) {
        const userData = await response.json();
        profileUsernameDisplay.textContent = userData.username;
        profileEmailDisplay.textContent = userData.email;
        // Populate edit form fields with current data
        editUsernameInput.value = userData.username;
        editEmailInput.value = userData.email;

        profileMessage.textContent = ''; // Clear message on success
        profileDetailsDiv.style.display = 'block'; // Show display div
        profileEditForm.style.display = 'none'; // Hide edit form
    } else if (response) {
        const errorData = await response.json();
        profileMessage.textContent = `Error loading profile: ${errorData.message || 'Unknown error'}`;
        profileMessage.style.color = 'red';
        console.error('Error loading profile:', errorData);
    }
}

/**
 * Saves updated user profile (username, email, new password) to the backend.
 */
async function saveUserProfile() {
    const userId = getUserId();
    if (!userId) {
        alert('User ID not found. Please log in.');
        clearAuthData();
        return;
    }

    const updatedUsername = editUsernameInput.value.trim();
    const updatedEmail = editEmailInput.value.trim();
    const newPassword = newPasswordInput.value.trim();
    const confirmNewPassword = confirmNewPasswordInput.value.trim();

    profileMessage.textContent = ''; // Clear previous messages
    profileMessage.style.color = 'red';

    // Client-side validation for profile update form
    if (!updatedUsername) {
        profileMessage.textContent = 'Username cannot be empty.';
        return;
    }
    if (!updatedEmail) {
        profileMessage.textContent = 'Email cannot be empty.';
        return;
    }
    if (newPassword && newPassword.length < 6) {
        profileMessage.textContent = 'New password must be at least 6 characters long.';
        return;
    }
    if (newPassword && newPassword !== confirmNewPassword) {
        profileMessage.textContent = 'New password and confirm password do not match.';
        return;
    }

    const updateData = {
        username: updatedUsername,
        email: updatedEmail
    };
    if (newPassword) {
        updateData.password = newPassword;
    }

    profileMessage.textContent = 'Saving profile changes...';
    profileMessage.style.color = 'blue';

    const response = await authenticatedFetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
    });

    if (response && response.ok) {
        const data = await response.json();
        profileMessage.textContent = data.message || 'Profile updated successfully!';
        profileMessage.style.color = 'green';
        // Refresh displayed data and switch back to view mode
        loadUserProfile();
        // Update username in local storage and welcome message if changed
        if (updatedUsername !== getUsername()) {
            localStorage.setItem('username', updatedUsername);
            welcomeMessage.textContent = `Welcome, ${updatedUsername}!`;
        }
    } else if (response) {
        const errorData = await response.json();
        profileMessage.textContent = `Error updating profile: ${errorData.message || 'Unknown error'}`;
        profileMessage.style.color = 'red';
        console.error('Error updating profile:', errorData);
    }
}


// --- Event Listeners ---

// Initial check for authentication status on page load
document.addEventListener('DOMContentLoaded', () => {
    const token = getAuthToken();
    const userId = getUserId();
    const username = getUsername();
    if (token && userId && username) {
        updateUIForAuth(true, username);
    } else {
        updateUIForAuth(false);
    }
});

// Toggle between Register and Login forms
registerBtn.addEventListener('click', () => {
    currentAuthMode = 'register';
    submitAuthBtn.textContent = 'Register';
    authMessage.textContent = '';
    showSection('auth-section'); // Ensure auth section is visible
});

loginBtn.addEventListener('click', () => {
    currentAuthMode = 'login';
    submitAuthBtn.textContent = 'Login';
    authMessage.textContent = '';
    showSection('auth-section'); // Ensure auth section is visible
});

// Handle form submission for login/register - conditional validation
authForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    const email = emailInput.value.trim(); // Always get email value, but use conditionally

    // CONDITIONAL VALIDATION BASED ON AUTH MODE
    if (currentAuthMode === 'register') {
        if (!username || !email || !password) {
            authMessage.textContent = 'Username, email, and password are required for registration.';
            authMessage.style.color = 'red';
            return;
        }
        await sendAuthRequest('register', { username, email, password }); // Pass object for register
    } else { // currentAuthMode === 'login'
        if (!username || !password) {
            authMessage.textContent = 'Username and password are required for login.';
            authMessage.style.color = 'red';
            return;
        }
        await sendAuthRequest('login', { username, password }); // Pass object for login
    }
});

// Handle logout
logoutBtn.addEventListener('click', () => {
    clearAuthData();
    authMessage.textContent = 'Logged out successfully.';
    authMessage.style.color = 'green';
    showSection('auth-section'); // Go back to auth section on logout
});

// Movie search event listeners
searchMovieBtn.addEventListener('click', () => {
    const title = movieSearchInput.value.trim();
    searchMoviesByTitle(title);
});

discoverGenreBtn.addEventListener('click', () => {
    const genreId = genreSelect.value;
    discoverMoviesByGenre(genreId);
});

// Event listener for "Add to Watchlist" buttons (uses event delegation)
movieResultsDiv.addEventListener('click', (event) => {
    if (event.target.classList.contains('add-to-watchlist-btn')) {
        const movieId = event.target.dataset.movieId;
        addMovieToWatchlist(movieId);
    }
});

// Event listener for "View My Watchlist" button
viewWatchlistBtn.addEventListener('click', () => {
    showSection('watchlist-section'); // Show watchlist section
    viewMyWatchlist();
});

// NEW: Event listener for "Back to Movies" button (from watchlist)
backToMoviesBtn.addEventListener('click', () => {
    showSection('movie-search-section'); // Show the movie search section
});

// Event listener for "Remove from Watchlist" buttons (uses event delegation)
watchlistResultsDiv.addEventListener('click', (event) => {
    if (event.target.classList.contains('remove-from-watchlist-btn')) {
        const watchlistId = event.target.dataset.watchlistId;
        removeMovieFromWatchlist(watchlistId);
    }
});

// Profile Management Event Listeners
profileBtn.addEventListener('click', () => {
    showSection('profile-management-section');
    loadUserProfile();
});

editProfileBtn.addEventListener('click', () => {
    // Populate form fields with current display values (already handled in loadUserProfile for initial load)
    // For manual edit, we ensure the form fields get the latest displayed values
    editUsernameInput.value = profileUsernameDisplay.textContent;
    editEmailInput.value = profileEmailDisplay.textContent;
    newPasswordInput.value = ''; // Clear password fields for new input
    confirmNewPasswordInput.value = '';
    profileDetailsDiv.style.display = 'none'; // Hide display
    profileEditForm.style.display = 'block'; // Show form
});

cancelEditBtn.addEventListener('click', () => {
    profileEditForm.style.display = 'none'; // Hide form
    profileDetailsDiv.style.display = 'block'; // Show display
    profileMessage.textContent = ''; // Clear any messages
});

profileEditForm.addEventListener('submit', async (event) => {
    event.preventDefault(); // Prevent default form submission
    saveUserProfile();
});

// NEW: Event listener for "Back to Movies" button (from profile)
backToMoviesFromProfileBtn.addEventListener('click', () => {
    showSection('movie-search-section'); // Show the movie search section
});