function isTokenExpired(token) {
    if (!token) return true;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return (Date.now() / 1000) > payload.exp;
    } catch (e) {
        return true;
    }
}

function getUserId() {
    const token = localStorage.getItem("token");
    if (!token) return null;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.id;
    } catch (e) {
        return null;
    }
}

function getUserRole() {
    const token = localStorage.getItem("token");
    if (!token) return null;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.role;
    } catch (e) {
        return null;
    }
}

function requireAdmin() {
    if (!requireAuth()) return false;
    const role = getUserRole();
    if (role !== "admin") {
        window.location.href = "/dashboard";
        return false;
    }
    return true;
}

function requireAuth() {
    const token = localStorage.getItem("token");
    const isExpired = isTokenExpired(token);
    
    if (!token || isExpired) {
        if (token) localStorage.removeItem("token");
        
        // Save message before redirect to show on login page
        if (token && isExpired) {
            sessionStorage.setItem('session_message', 'Login session expired. Please login again.');
        } else if (!token) {
            sessionStorage.setItem('session_message', 'Login required.');
        }
        
        window.location.href = "/login";
        return false;
    }
    return true;
}

// Global Auth Check and Notification display
(function() {
    const path = window.location.pathname;
    const page = path.split("/").pop();
    const publicPages = ["login", "register", "index", "", "/", "index.html", "login.html", "register.html"];
    
    // Auto-protect all other pages
    if (!publicPages.includes(page) && !publicPages.includes(path)) {
        requireAuth();
    }
    
    // Display persisted session messages via Toast
    window.addEventListener('load', () => {
        const msg = sessionStorage.getItem('session_message');
        if (msg && typeof showToast === 'function') {
            showToast(msg, 'info');
            sessionStorage.removeItem('session_message');
        }

        // Inject Admin link if user is admin
        const role = getUserRole();
        if (role === 'admin') {
            const navLinks = document.querySelector('.nav-links');
            if (navLinks && !document.getElementById('adminNavLink')) {
                const adminLink = document.createElement('a');
                adminLink.id = 'adminNavLink';
                adminLink.href = '/admin';
                adminLink.innerText = 'Admin Panel';
                adminLink.style.color = '#ef4444'; // Make it stand out
                adminLink.style.fontWeight = 'bold';
                
                // Insert before the profile link if possible, or just append
                const profileLink = Array.from(navLinks.querySelectorAll('a')).find(a => a.href.includes('profile.html'));
                if (profileLink) {
                    navLinks.insertBefore(adminLink, profileLink);
                } else {
                    navLinks.appendChild(adminLink);
                }
            }
        }
    });
})();

function redirectIfAuthenticated() {
    const token = localStorage.getItem("token");
    if (token && !isTokenExpired(token)) {
        window.location.href = "/dashboard";
    } else if (token) {
        localStorage.removeItem("token");
    }
}

function logout() {
    localStorage.removeItem("token");
    window.location.href = "/login";
}

// Global showConfirm fallback helper (returns Promise resolving to boolean)
window.showConfirm = window.showConfirm || function(message) {
    return Promise.resolve(window.confirm(message));
};