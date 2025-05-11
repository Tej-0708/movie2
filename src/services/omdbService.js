const axios = require('axios');
const API_CONFIG = require('../config/api');

class OMDBService {
    constructor() {
        this.api = axios.create({
            baseURL: API_CONFIG.baseUrl,
            timeout: API_CONFIG.timeout,
            params: {
                apikey: API_CONFIG.apiKey
            }
        });
    }

    async makeRequest(params, retryCount = 0) {
        try {
            const response = await this.api.get('', { params });
            
            // Check for OMDB API error response
            if (response.data.Error) {
                throw new Error(response.data.Error);
            }
            
            return response.data;
        } catch (error) {
            // Handle rate limiting
            if (error.response && error.response.status === 429) {
                if (retryCount < API_CONFIG.retryAttempts) {
                    await new Promise(resolve => setTimeout(resolve, API_CONFIG.retryDelay * 2));
                    return this.makeRequest(params, retryCount + 1);
                }
            }
            
            // Handle other errors
            if (retryCount < API_CONFIG.retryAttempts) {
                await new Promise(resolve => setTimeout(resolve, API_CONFIG.retryDelay));
                return this.makeRequest(params, retryCount + 1);
            }
            
            throw error;
        }
    }

    async searchMovies(query, page = 1) {
        return this.makeRequest({
            s: query,
            type: 'movie',
            page
        });
    }

    async searchTVShows(query, page = 1) {
        return this.makeRequest({
            s: query,
            type: 'series',
            page
        });
    }

    async getMovieDetails(imdbId) {
        return this.makeRequest({
            i: imdbId,
            plot: 'full'
        });
    }

    async getTVShowDetails(imdbId) {
        return this.makeRequest({
            i: imdbId,
            plot: 'full'
        });
    }

    async getSeasonDetails(imdbId, season) {
        return this.makeRequest({
            i: imdbId,
            Season: season
        });
    }

    async getEpisodeDetails(imdbId, season, episode) {
        return this.makeRequest({
            i: imdbId,
            Season: season,
            Episode: episode
        });
    }

    async getRecentMovies(year, page = 1) {
        return this.makeRequest({
            y: year,
            type: 'movie',
            page
        });
    }

    formatSearchResult(item) {
        if (!item) return null;
        return {
            id: item.imdbID,
            title: item.Title,
            type: item.Type,
            year: item.Year,
            poster: item.Poster !== 'N/A' ? item.Poster : null,
            imdbRating: item.imdbRating || 'N/A'
        };
    }

    formatMovie(movie) {
        if (!movie) return null;
        return {
            id: movie.imdbID,
            title: movie.Title,
            year: movie.Year,
            rated: movie.Rated,
            released: movie.Released,
            runtime: movie.Runtime,
            genre: movie.Genre,
            director: movie.Director,
            writer: movie.Writer,
            actors: movie.Actors,
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

    formatTVShow(show) {
        if (!show) return null;
        return {
            id: show.imdbID,
            title: show.Title,
            year: show.Year,
            rated: show.Rated,
            released: show.Released,
            runtime: show.Runtime,
            genre: show.Genre,
            director: show.Director,
            writer: show.Writer,
            actors: show.Actors,
            plot: show.Plot,
            language: show.Language,
            country: show.Country,
            awards: show.Awards,
            poster: show.Poster !== 'N/A' ? show.Poster : null,
            ratings: show.Ratings || [],
            metascore: show.Metascore,
            imdbRating: show.imdbRating,
            imdbVotes: show.imdbVotes,
            type: show.Type,
            totalSeasons: show.totalSeasons
        };
    }
}

module.exports = new OMDBService(); 