const axios = require('axios');
const API_CONFIG = require('../config/api');

class MovieService {
    constructor() {
        this.axiosInstance = axios.create({
            baseURL: API_CONFIG.baseUrl,
            timeout: API_CONFIG.timeout,
            params: {
                apikey: API_CONFIG.apiKey
            }
        });
    }

    async makeRequest(params = {}) {
        let lastError;
        
        for (let attempt = 1; attempt <= API_CONFIG.retryAttempts; attempt++) {
            try {
                console.log(`[Fetch Attempt ${attempt}] Making request to OMDB API`);
                const response = await this.axiosInstance.get('', { params });
                
                if (response.data.Error) {
                    throw new Error(response.data.Error);
                }
                
                return response.data;
            } catch (error) {
                lastError = error;
                console.error(`[Fetch Attempt ${attempt}] Caught error:`, error.message);
                
                if (error.response) {
                    console.error(`[Fetch Attempt ${attempt}] Server error:`, error.response.status, error.response.data);
                    if (error.response.status === 429) {
                        await new Promise(resolve => setTimeout(resolve, API_CONFIG.retryDelay * 2));
                    }
                } else if (error.request) {
                    console.error(`[Fetch Attempt ${attempt}] Network error code:`, error.code);
                } else {
                    console.error(`[Fetch Attempt ${attempt}] Request setup error:`, error.message);
                }

                if (attempt < API_CONFIG.retryAttempts) {
                    console.log(`[Fetch Attempt ${attempt}] Retrying in ${API_CONFIG.retryDelay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, API_CONFIG.retryDelay));
                }
            }
        }

        throw new Error(`Failed after ${API_CONFIG.retryAttempts} attempts. Last error: ${lastError.message}`);
    }

    async searchMovies(query, page = 1) {
        return this.makeRequest({
            s: query,
            page: page,
            type: 'movie'
        });
    }

    async getMovieDetails(imdbId) {
        return this.makeRequest({
            i: imdbId,
            plot: 'full'
        });
    }

    async getPopularMovies(page = 1) {
        // OMDB doesn't have a direct "popular" endpoint, so we'll search for recent movies
        const currentYear = new Date().getFullYear();
        return this.makeRequest({
            s: '*',
            y: currentYear,
            type: 'movie',
            page: page
        });
    }

    formatMovie(movie) {
        if (!movie) return null;

        return {
            api_id: movie.imdbID,
            title: movie.Title,
            year: movie.Year,
            rated: movie.Rated,
            released: movie.Released,
            runtime: movie.Runtime,
            genre: movie.Genre ? movie.Genre.split(', ') : [],
            director: movie.Director,
            writer: movie.Writer,
            actors: movie.Actors ? movie.Actors.split(', ') : [],
            plot: movie.Plot,
            language: movie.Language,
            country: movie.Country,
            awards: movie.Awards,
            poster: movie.Poster !== 'N/A' ? movie.Poster : null,
            ratings: movie.Ratings || [],
            metascore: movie.Metascore,
            imdbRating: movie.imdbRating,
            imdbVotes: movie.imdbVotes,
            type: movie.Type,
            dvd: movie.DVD,
            boxOffice: movie.BoxOffice,
            production: movie.Production,
            website: movie.Website
        };
    }

    formatSearchResult(movie) {
        if (!movie) return null;

        return {
            api_id: movie.imdbID,
            title: movie.Title,
            year: movie.Year,
            type: movie.Type,
            poster: movie.Poster !== 'N/A' ? movie.Poster : null
        };
    }
}

module.exports = new MovieService();