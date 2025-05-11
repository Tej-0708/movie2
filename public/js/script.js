/**
 * Frontend JavaScript for Movie Watchlist Application
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- Global Variables & Configuration ---
    const API_BASE_URL = 'http://localhost:3000'; // Base URL for backend API calls
    const state = { // Simple state management
        watchlist: new Set(), // Store API IDs of items currently on watchlist
        token: localStorage.getItem('authToken'),
        user: JSON.parse(localStorage.getItem('userData')),
    };

    // --- DOM Element Selectors ---
    // Auth Forms
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    // Dashboard Elements
    const dashboardMain = document.querySelector('.dashboard-main');
    const usernameDisplay = document.getElementById('username-display');
    const logoutButton = document.getElementById('logout-button');
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const searchResultsSection = document.getElementById('search-results-section');
    const searchResultsContainer = document.getElementById('search-results');
    const searchLoader = document.getElementById('search-results-loader');
    const searchError = document.getElementById('search-error');
    const closeSearchButton = searchResultsSection?.querySelector('.close-section-btn');

    // Content Sections
    const watchlistContainer = document.getElementById('watchlist-items');
    const watchlistLoader = document.getElementById('watchlist-loader');
    const watchlistError = document.getElementById('watchlist-error');

    const recommendationsContainer = document.getElementById('recommendations');
    const recommendationsLoader = document.getElementById('recommendations-loader');
    const recommendationsError = document.getElementById('recommendations-error');

    const trendingContainer = document.getElementById('trending-items');
    const trendingLoader = document.getElementById('trending-loader');
    const trendingError = document.getElementById('trending-error');

    // Modal Elements
    const modal = document.getElementById('media-details-modal');
    const modalBody = document.getElementById('modal-body');
    const modalLoader = document.getElementById('modal-loader');
    const modalError = document.getElementById('modal-error');
    const closeModalButton = modal?.querySelector('.modal-close-btn');

    // Notification Area
    const notificationArea = document.getElementById('notification-area');

    // --- Utility Functions ---

    /**
     * Shows a notification message.
     * @param {string} message - The message to display.
     * @param {string} type - 'success' or 'error'.
     * @param {number} duration - Duration in milliseconds.
     */
    function showNotification(message, type = 'success', duration = 3000) {
        if (!notificationArea) return;
        notificationArea.textContent = message;
        notificationArea.className = `notification ${type} show`; // Add type and show class
        setTimeout(() => {
            notificationArea.classList.remove('show');
        }, duration);
    }

    /**
     * Displays an error message within a specific form or section.
     * @param {HTMLElement} container - The container element for the error message.
     * @param {string} message - The error message.
     */
    function displayError(container, message) {
        if (container) {
            container.textContent = message;
            container.style.display = 'block';
        }
        // Also log to console for debugging
        console.error("Error displayed:", message);
    }

    /** Clears error messages from a container */
    function clearError(container) {
        if (container) {
            container.textContent = '';
            container.style.display = 'none';
        }
    }

    /** Toggles the visibility of a loader element */
    function toggleLoader(loaderElement, show) {
        if(loaderElement) {
            loaderElement.classList.toggle('hidden', !show);
        }
    }

    /** Validates form inputs based on 'required', 'minlength', etc. */
    function validateInput(input) {
        const errorSpan = input.nextElementSibling; // Assuming error span follows input
        let isValid = true;
        let message = '';

        input.classList.remove('input-error'); // Reset error state
        if (errorSpan) errorSpan.textContent = ''; // Clear previous message

        if (input.required && !input.value.trim()) {
            isValid = false;
            message = `${input.labels[0]?.textContent || 'Field'} is required.`;
        } else if (input.minLength > 0 && input.value.length < input.minLength) {
            isValid = false;
            message = `${input.labels[0]?.textContent || 'Field'} must be at least ${input.minLength} characters long.`;
        } else if (input.type === 'password' && input.id === 'confirm-password') {
            const passwordInput = input.form.querySelector('#password');
            if (passwordInput && input.value !== passwordInput.value) {
                isValid = false;
                message = 'Passwords do not match.';
            }
        }
        // Add more validation rules as needed (email format, etc.)

        if (!isValid) {
            input.classList.add('input-error');
            if (errorSpan) errorSpan.textContent = message;
        }
        return isValid;
    }

    // --- API Interaction ---

    /**
     * Makes an authenticated fetch request to the backend API.
     * Handles token attachment and basic error/auth handling.
     * @param {string} url - The API endpoint (relative to API_BASE_URL).
     * @param {object} [options={}] - Fetch options (method, body, etc.).
     * @returns {Promise<any>} - The JSON response data.
     * @throws {Error} - If the request fails or returns an error status.
     */
    async function fetchAuth(url, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers, // Allow overriding headers
        };
        // Add Authorization header if token exists
        if (state.token) {
            headers['Authorization'] = `Bearer ${state.token}`;
        }

        try {
            console.log(`Making ${options.method || 'GET'} request to ${API_BASE_URL}${url}`);
            if (options.body) {
                console.log('Request payload:', options.body);
            }
            
            const response = await fetch(`${API_BASE_URL}${url}`, { ...options, headers });
            console.log(`Response status:`, response.status);

            // Handle non-OK responses
            if (!response.ok) {
                let errorData;
                try {
                    errorData = await response.json(); // Try parsing JSON error body
                } catch (e) {
                    // If response body is not JSON or empty
                    errorData = { message: `Request failed with status: ${response.status}` };
                }

                console.error("API Error:", response.status, errorData);

                // Handle specific authentication errors (401 Unauthorized, 403 Forbidden)
                if (response.status === 401 || response.status === 403) {
                    // For login endpoint, don't log out the user on auth failure (they're trying to log in)
                    if (!url.includes('/auth/login')) {
                        // Log out user if token is invalid/expired
                        logout("Session expired or invalid. Please login again.");
                    }
                    // Throw specific error to prevent further processing
                    throw new Error(errorData.message || 'Authentication failed.');
                }
                // Throw error with message from backend if available
                throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
            }

            // Handle successful responses that might not have content (e.g., 204 No Content)
            if (response.status === 204) {
                return null; // Return null for no content responses
            }

            // Parse JSON response for successful requests with content
            const data = await response.json();
            console.log('Response data:', data);
            return data;

        } catch (error) {
            console.error('Fetch Error:', error);
            // Re-throw the error so calling function can handle it (e.g., display to user)
            throw error;
        }
    }

    // --- Authentication Logic ---

    /** Handles user login */
    async function handleLogin(event) {
        event.preventDefault();
        const form = event.target;
        const errorMsgContainer = form.querySelector('.form-error-msg');
        clearError(errorMsgContainer);

        // Validate form inputs
        let isFormValid = true;
        form.querySelectorAll('input[required], input[minlength]').forEach(input => {
            if (!validateInput(input)) isFormValid = false;
        });
        if (!isFormValid) return;

        const username = form.username.value;
        const password = form.password.value;

        try {
            const data = await fetchAuth('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ username, password }),
            });

            if (data.token && data.user) {
                // Store token and user data
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('userData', JSON.stringify(data.user));
                state.token = data.token;
                state.user = data.user;
                // Redirect to dashboard on successful login
                window.location.href = '/dashboard.html';
            } else {
                // Should be caught by fetchAuth error handling, but defensive check
                displayError(errorMsgContainer, 'Login failed. Invalid response from server.');
            }
        } catch (error) {
            // Display error message from fetchAuth exception
            displayError(errorMsgContainer, error.message || 'Login failed. Please try again.');
        }
    }

    /** Handles user registration */
    async function handleRegister(event) {
        event.preventDefault();
        const form = event.target;
        const errorMsgContainer = form.querySelector('.form-error-msg');
        const successMsgContainer = form.querySelector('.form-success-msg');
        clearError(errorMsgContainer);
        clearError(successMsgContainer); // Clear previous success message

        // Validate form inputs
        let isFormValid = true;
        form.querySelectorAll('input[required], input[minlength], input#confirm-password').forEach(input => {
            if (!validateInput(input)) isFormValid = false;
        });
        if (!isFormValid) return;


        const username = form.username.value;
        const password = form.password.value;
        // confirmPassword validation handled by validateInput

        try {
            const data = await fetchAuth('/auth/register', { // <-- CORRECTED URL
                method: 'POST',
                body: JSON.stringify({ username, password }),
            });
            // Display success message
            if(successMsgContainer) {
                successMsgContainer.textContent = data.message + " You can now login.";
                successMsgContainer.style.display = 'block';
            }
            form.reset(); // Clear form fields
            // Optional: Redirect to login after delay
            // setTimeout(() => { window.location.href = '/index.html'; }, 2000);

        } catch (error) {
            displayError(errorMsgContainer, error.message || 'Registration failed. Please try again.');
        }
    }

    /** Logs the user out */
    function logout(reason = "You have been logged out.") {
        console.log("Logging out...");
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        state.token = null;
        state.user = null;
        // Optional: Call backend logout endpoint if it implements blocklisting etc.
        // fetchAuth('/auth/logout', { method: 'POST' }).catch(err => console.warn("Logout API call failed:", err));

        // Redirect to login page with a reason (optional)
        alert(reason); // Simple alert, replace with better UX if needed
        window.location.href = '/index.html';
    }


    // --- Dashboard Content Loading & Rendering ---

    /** Fetches and renders the user's watchlist */
    async function loadWatchlist() {
        toggleLoader(watchlistLoader, true);
        clearError(watchlistError);
        try {
            const watchlistData = await fetchAuth('/api/watchlist');
            // Update local state of watchlist IDs
            state.watchlist = new Set(watchlistData.map(item => item.api_id));
            renderMediaGrid(watchlistContainer, watchlistData, true); // isWatchlist = true
        } catch (error) {
            displayError(watchlistError, `Could not load watchlist: ${error.message}`);
            renderMediaGrid(watchlistContainer, [], true); // Render empty grid on error
        } finally {
            toggleLoader(watchlistLoader, false);
        }
    }

    /** Fetches and renders recommendations */
    async function loadRecommendations() {
        toggleLoader(recommendationsLoader, true);
        clearError(recommendationsError);
        try {
            const recommendationsData = await fetchAuth('/api/recommendations');
            // Recommendations data structure: { recommendations: [], source: "..." }
            renderMediaGrid(recommendationsContainer, recommendationsData.recommendations || [], false); // isWatchlist = false
        } catch (error) {
            displayError(recommendationsError, `Could not load recommendations: ${error.message}`);
            renderMediaGrid(recommendationsContainer, [], false); // Render empty grid on error
        } finally {
            toggleLoader(recommendationsLoader, false);
        }
    }

    /** Fetches and renders trending items */
    async function loadTrending() {
        toggleLoader(trendingLoader, true);
        clearError(trendingError);
        try {
            const trendingData = await fetchAuth('/api/movies/trending?timeWindow=week');
            // Trending data structure: { results: [], ... }
            renderMediaGrid(trendingContainer, trendingData.results || [], false); // isWatchlist = false
        } catch (error) {
            displayError(trendingError, `Could not load trending items: ${error.message}`);
            renderMediaGrid(trendingContainer, [], false); // Render empty grid on error
        } finally {
            toggleLoader(trendingLoader, false);
        }
    }

    /** Performs search and renders results */
    async function handleSearch() {
        const query = searchInput.value.trim();
        if (!query) {
            showNotification("Please enter a search term.", "error", 2000);
            return;
        };

        console.log(`Performing search for: "${query}"`);
        searchResultsContainer.innerHTML = ''; // Clear previous results
        toggleLoader(searchLoader, true);
        clearError(searchError);
        searchResultsSection.classList.remove('hidden'); // Show the section

        try {
            // Search both movies and TV shows concurrently
            const movieResultsPromise = fetchAuth(`/api/movies/search?query=${encodeURIComponent(query)}&type=movie`);
            const tvResultsPromise = fetchAuth(`/api/movies/search?query=${encodeURIComponent(query)}&type=tv`);

            // Wait for both searches to complete
            const [movieData, tvData] = await Promise.all([movieResultsPromise, tvResultsPromise]);

            // Combine results (handle potential empty results)
            const combinedResults = [
                ...(movieData.results || []),
                ...(tvData.results || [])
            ];

            if (combinedResults.length === 0) {
                searchResultsContainer.innerHTML = '<p>No results found.</p>';
            } else {
                renderMediaGrid(searchResultsContainer, combinedResults, false); // isWatchlist = false
            }

        } catch (error) {
            displayError(searchError, `Search failed: ${error.message}`);
            searchResultsContainer.innerHTML = ''; // Clear container on error
        } finally {
            toggleLoader(searchLoader, false);
        }
    }


    /**
     * Renders a grid of movie/TV show cards.
     * @param {HTMLElement} container - The container element to render into.
     * @param {Array} items - Array of media items (movies/TV shows).
     * @param {boolean} isWatchlist - True if rendering the watchlist (shows remove button).
     */
    function renderMediaGrid(container, items, isWatchlist) {
        if (!container) {
            console.error("Render target container not found!");
            return;
        }
        container.innerHTML = ''; // Clear previous content

        if (!items || items.length === 0) {
            container.innerHTML = `<p class="empty-message">${isWatchlist ? 'Your watchlist is empty.' : 'No items to display.'}</p>`;
            return;
        }

        items.forEach(item => {
            // Defensive check for essential data
            if (!item || !item.api_id || !item.title) {
                console.warn("Skipping rendering item due to missing data:", item);
                return;
            };

            const isOnWatchlist = state.watchlist.has(item.api_id.toString());
            const actionButtonIcon = isOnWatchlist ? '−' : '+'; // Minus or Plus symbol
            const actionButtonTitle = isOnWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist';
            const actionButtonClass = isOnWatchlist ? 'remove' : 'add';

            const card = document.createElement('div');
            card.className = 'movie-card';
            card.dataset.apiId = item.api_id;
            card.dataset.type = item.type; // Store type ('movie' or 'tv')
            card.setAttribute('tabindex', '0'); // Make card focusable
            card.setAttribute('role', 'button'); // Semantics
            card.setAttribute('aria-label', `View details for ${item.title}`);


            const posterUrl = item.poster_path || 'images/no_image_placeholder.png'; // Use a local placeholder
            const year = item.release_date ? item.release_date.substring(0, 4) : 'N/A';

            card.innerHTML = `
                <a href="#" class="card-poster-link" data-api-id="${item.api_id}" data-type="${item.type}">
                    <img src="${posterUrl}" alt="${item.title} Poster" class="card-poster">
                </a>
                <div class="card-info">
                    <h3 class="card-title">${item.title}</h3>
                    <p class="card-year">${year}</p>
                    <button
                        class="watchlist-btn ${actionButtonClass}"
                        data-api-id="${item.api_id}"
                        data-type="${item.type}"
                        aria-label="${actionButtonTitle}"
                    >${actionButtonIcon}</button>
                </div>
            `;

            container.appendChild(card);

            // Add event listener for showing modal on card click
            card.querySelector('.card-poster-link').addEventListener('click', (e) => {
                e.preventDefault();
                const apiId = e.currentTarget.dataset.apiId;
                const type = e.currentTarget.dataset.type;
                loadMediaDetails(apiId, type);
            });
        });
    }

    /**
     * Loads and displays the details of a specific movie or TV show in a modal.
     * @param {string} apiId - The API ID of the media item.
     * @param {string} type - The type of media ('movie' or 'tv').
     */
    async function loadMediaDetails(apiId, type) {
        if (!modal || !modalBody || !modalLoader || !modalError) {
            console.error("Modal elements not found!");
            return;
        }

        modalBody.innerHTML = '';
        clearError(modalError);
        toggleLoader(modalLoader, true);
        modal.classList.add('show'); // Show the modal

        try {
            const details = await fetchAuth(`/api/movies/details/${apiId}?type=${type}`);
            if (details) {
                modalBody.innerHTML = `
                    <h3>${details.title || details.name}</h3>
                    <p>Release Date: ${details.release_date || details.first_air_date || 'N/A'}</p>
                    <p>Overview: ${details.overview || 'No overview available.'}</p>
                    ${details.genres ? `<p>Genres: ${details.genres.map(g => g.name).join(', ')}</p>` : ''}
                    ${details.runtime ? `<p>Runtime: ${details.runtime} minutes</p>` : ''}
                    ${details.number_of_seasons ? `<p>Seasons: ${details.number_of_seasons}</p>` : ''}
                    ${details.number_of_episodes ? `<p>Episodes: ${details.number_of_episodes}</p>` : ''}
                    ${details.vote_average ? `<p>Rating: ${details.vote_average}/10</p>` : ''}
                    ${details.poster_path ? `<img src="${details.poster_path}" alt="${details.title || details.name} Poster" style="max-width: 200px;">` : '<p>No poster available.</p>'}
                    <button class="watchlist-btn ${state.watchlist.has(details.api_id?.toString()) ? 'remove' : 'add'}" data-api-id="${details.api_id}" data-type="${type}" aria-label="${state.watchlist.has(details.api_id?.toString()) ? 'Remove from Watchlist' : 'Add to Watchlist'}">${state.watchlist.has(details.api_id?.toString()) ? '− Remove from Watchlist' : '+ Add to Watchlist'}</button>
                    `;
                // Re-attach event listener to the watchlist button inside the modal
                const modalWatchlistButton = modalBody.querySelector('.watchlist-btn');
                if (modalWatchlistButton) {
                    modalWatchlistButton.addEventListener('click', handleWatchlistButtonClick);
                }
            } else {
                modalBody.innerHTML = '<p>Could not load details.</p>';
            }
        } catch (error) {
            displayError(modalError, `Failed to load details: ${error.message}`);
        } finally {
            toggleLoader(modalLoader, false);
        }
    }

    /** Handles closing the modal */
    function closeModal() {
        if (modal) {
            modal.classList.remove('show');
            modalBody.innerHTML = '';
            clearError(modalError);
        }
    }

    /** Handles clicks on the watchlist buttons (both in grid and modal) */
    async function handleWatchlistButtonClick(event) {
        const button = event.currentTarget;
        const apiId = button.dataset.apiId;
        const type = button.dataset.type;
        const isAdding = !state.watchlist.has(apiId);
        const method = isAdding ? 'POST' : 'DELETE';
        const endpoint = '/api/watchlist';

        try {
            let response;
            if (isAdding) {
                // === ADDING TO WATCHLIST: Fetch details first ===
                console.log(`Fetching details for ${type} ID ${apiId} before adding to watchlist...`);
                // Fetch full details from our backend API
                const details = await fetchAuth(`/api/movies/${type}/${apiId}`); 
                
                if (!details || !details.api_id) {
                    throw new Error('Could not fetch movie/TV details to add to watchlist.');
                }

                // Send the POST request with full details
                response = await fetchAuth(endpoint, {
                    method: 'POST',
                    // Send the full details object fetched from the /api/movies/:type/:id endpoint
                    body: JSON.stringify(details), 
                });
            } else {
                // === REMOVING FROM WATCHLIST ===
                // For DELETE, we need the apiMovieId in the URL, not the body
                const deleteEndpoint = `/api/watchlist/${apiId}`; // Use API ID in URL for DELETE
                response = await fetchAuth(deleteEndpoint, {
                    method: 'DELETE',
                });
            }

            // --- Handle Response (same for add/remove) ---
            if (response && response.message) {
                showNotification(response.message, 'success');
                // Update local watchlist state and button appearance
                const card = button.closest('.movie-card');
                const modalButton = modalBody.querySelector(`.watchlist-btn[data-api-id="${apiId}"]`);

                if (isAdding) {
                    state.watchlist.add(apiId);
                    button.textContent = '−';
                    button.classList.remove('add');
                    button.classList.add('remove');
                    button.setAttribute('aria-label', 'Remove from Watchlist');
                    if (modalButton) {
                       modalButton.textContent = '− Remove from Watchlist';
                       modalButton.classList.remove('add');
                       modalButton.classList.add('remove');
                    }
                } else {
                    state.watchlist.delete(apiId);
                    button.textContent = '+';
                    button.classList.remove('remove');
                    button.classList.add('add');
                    button.setAttribute('aria-label', 'Add to Watchlist');
                    if (modalButton) {
                       modalButton.textContent = '+ Add to Watchlist';
                       modalButton.classList.remove('remove');
                       modalButton.classList.add('add');
                    }
                }
                
                // Refresh the watchlist display if we are on the dashboard
                if (watchlistContainer && document.body.contains(watchlistContainer)) { 
                    loadWatchlist();
                }
                // If the modal is open and the button clicked was inside it, refresh its content
                // Note: This might cause a brief flicker in the modal button
                if (modal && modal.classList.contains('show') && modalBody.contains(button)) {
                    loadMediaDetails(apiId, type); // Refresh modal content
                }

            } else if (response && response.error) { // Backend might send { error: ... }
                showNotification(response.error, 'error');
            } else {
                // Catchall for unexpected responses
                showNotification(`Watchlist update failed. Unexpected response from server.`, 'error');
            }

        } catch (error) {
            // Catch errors from fetchAuth (network, API errors, auth errors)
            showNotification(`Failed to update watchlist: ${error.message}`, 'error');
        }
    }

    /** Initializes the dashboard if the user is authenticated */
    function initializeDashboard() {
        if (state.token && state.user) {
            if (usernameDisplay) {
                usernameDisplay.textContent = state.user.username;
            }
            loadWatchlist();
            loadRecommendations();
            loadTrending();
        } else {
            // Redirect to login if not authenticated on dashboard page
            if (window.location.pathname === '/dashboard.html') {
                window.location.href = '/index.html';
            }
        }
    }

    // --- Event Listeners ---

    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    if (logoutButton) {
        logoutButton.addEventListener('click', logout);
    }

    if (searchButton) {
        searchButton.addEventListener('click', handleSearch);
    }

    if (searchInput) {
        searchInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                handleSearch();
            }
        });
    }

    if (closeSearchButton) {
        closeSearchButton.addEventListener('click', () => {
            searchResultsSection.classList.add('hidden');
            searchResultsContainer.innerHTML = '';
            clearError(searchError);
            searchInput.value = '';
        });
    }

    // Event delegation for watchlist buttons in the grid
    if (document.querySelector('.media-grid-container')) {
        document.querySelector('.media-grid-container').addEventListener('click', (event) => {
            if (event.target.classList.contains('watchlist-btn')) {
                handleWatchlistButtonClick(event);
            }
        });
    }

    // Event listener for watchlist buttons inside the modal (using delegation on modal body)
    if (modalBody) {
        modalBody.addEventListener('click', (event) => {
            if (event.target.classList.contains('watchlist-btn')) {
                handleWatchlistButtonClick(event);
            }
        });
    }

    if (closeModalButton) {
        closeModalButton.addEventListener('click', closeModal);
    }

    if (modal) {
        // Close modal when clicking outside
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                closeModal();
            }
        });
        // Close modal with Escape key
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && modal.classList.contains('show')) {
                closeModal();
            }
        });
    }

    // --- Initialization ---
    initializeDashboard();
});