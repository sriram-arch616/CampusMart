(function() {
    // Define the backend URL. In production, same origin by default (served/proxied via Nginx)
    const API_BASE_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && window.location.port !== '5000'
        ? `${window.location.protocol}//${window.location.hostname}:5000`
        : '';

    // Monkey-patch window.fetch
    const originalFetch = window.fetch;
    window.fetch = function(input, init) {
        init = init || {};
        init.credentials = 'include';
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
        return originalFetch(input, init).then(response => {
            if (response.status === 401 && !window.location.pathname.includes('login') && !window.location.pathname.includes('register') && window.location.pathname !== '/' && !window.location.pathname.includes('index')) {
                localStorage.removeItem("user");
                sessionStorage.setItem('session_message', 'Login session expired. Please login again.');
                window.location.href = "/login";
            }
            return response;
        });
    };

    // Expose API_BASE_URL globally
    window.API_BASE_URL = API_BASE_URL;
})();
