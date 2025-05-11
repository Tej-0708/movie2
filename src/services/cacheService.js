// Simple in-memory cache with Time-To-Live (TTL)
// For production, consider using Redis or Memcached for scalability and persistence.

const cache = {}; // Use a plain object as the cache store
const DEFAULT_CACHE_TTL = 5 * 60 * 1000; // Default Cache Time-To-Live: 5 minutes in milliseconds

/**
 * Stores data in the cache with an optional TTL.
 * @param {string} key - The cache key.
 * @param {*} data - The data to store.
 * @param {number} [ttl=DEFAULT_CACHE_TTL] - Time-to-live in milliseconds.
 */
const setCache = (key, data, ttl = DEFAULT_CACHE_TTL) => {
    if (!key) return; // Do nothing if key is invalid
    console.log(`Caching data for key: ${key} with TTL: ${ttl / 1000}s`);
    const expiresAt = Date.now() + ttl;
    cache[key] = {
        data: data,
        expiresAt: expiresAt
    };
};

/**
 * Retrieves data from the cache if it exists and hasn't expired.
 * @param {string} key - The cache key.
 * @returns {*} - The cached data, or null if not found or expired.
 */
const getCache = (key) => {
    if (!key) return null; // Key is required

    const cachedItem = cache[key];

    // Check if item exists
    if (!cachedItem) {
        // console.log(`Cache miss (not found) for key: ${key}`);
        return null;
    }

    // Check if item has expired
    if (Date.now() > cachedItem.expiresAt) {
        console.log(`Cache expired for key: ${key}`);
        delete cache[key]; // Remove expired item from cache
        return null;
    }

    // Item exists and is not expired
    // console.log(`Cache hit for key: ${key}`);
    return cachedItem.data;
};

/**
 * Deletes a specific key or clears the entire cache.
 * @param {string} [key=null] - The key to delete. If null, clears all cache.
 */
const clearCache = (key = null) => {
    if (key) {
        if (cache[key]) {
            console.log(`Clearing cache for key: ${key}`);
            delete cache[key];
        }
    } else {
        console.log('Clearing entire in-memory cache');
        // Iterate and delete all properties from the cache object
        for (const prop in cache) {
            if (Object.prototype.hasOwnProperty.call(cache, prop)) {
                 delete cache[prop];
            }
        }
        // Or simply reset: cache = {}; (if no external references held)
    }
};

/**
 * Utility function to check cache size (number of keys).
 * @returns {number} - The number of items currently in the cache.
 */
const getCacheSize = () => {
    return Object.keys(cache).length;
};

module.exports = {
    setCache,
    getCache,
    clearCache,
    getCacheSize
};