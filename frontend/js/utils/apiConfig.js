(function() {
    // Define the backend URL. In production, change this to your deployed API server URL.
    const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:5000'
        : ''; // Fallback or configured production URL (same origin by default if empty)

    // Monkey-patch window.fetch
    const originalFetch = window.fetch;
    window.fetch = function(input, init) {
        if (typeof input === 'string') {
            // Intercept relative paths for API endpoints
            if (input.startsWith('/api') || 
                input.startsWith('/login') || 
                input.startsWith('/register') || 
                input.startsWith('/verify-email') || 
                input.startsWith('/forgot-password') || 
                input.startsWith('/reset-password') ||
                input.startsWith('/protected') ||
                input.startsWith('/uploads')) {
                input = API_BASE_URL + input;
            }
        }
        return originalFetch(input, init);
    };

    // Expose API_BASE_URL globally
    window.API_BASE_URL = API_BASE_URL;
})();
