function getUserId() {
    try {
        const user = JSON.parse(localStorage.getItem("user"));
        return user ? user.id : null;
    } catch (e) {
        return null;
    }
}

function getUserRole() {
    try {
        const user = JSON.parse(localStorage.getItem("user"));
        return user ? user.role : null;
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
    const user = localStorage.getItem("user");
    
    if (!user) {
        sessionStorage.setItem('session_message', 'Login required.');
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
    const user = localStorage.getItem("user");
    if (user) {
        window.location.href = "/dashboard";
    }
}

function logout() {
    fetch("/logout", { method: "POST" }).finally(() => {
        localStorage.removeItem("user");
        window.location.href = "/login";
    });
}

// Global showConfirm fallback helper (returns Promise resolving to boolean)
window.showConfirm = window.showConfirm || function(message) {
    return Promise.resolve(window.confirm(message));
};