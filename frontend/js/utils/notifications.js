/* notifications.js */
(function() {
    // Existing Toast Container
    const toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    document.body.appendChild(toastContainer);

    window.showToast = function(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        let icon = '🔔';
        if (type === 'success') icon = '✅';
        if (type === 'error') icon = '❌';
        if (type === 'info') icon = 'ℹ️';

        toast.innerHTML = `
            <span class="toast-icon">${icon}</span>
            <span class="toast-message">${message}</span>
        `;

        toastContainer.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 500);
        }, duration);
    };

    window.showConfirm = function(message) {
        return Promise.resolve(window.confirm(message));
    };

    // --- Persistent Notifications Logic ---

    let notifications = [];

    async function fetchNotifications() {
        try {
            const token = localStorage.getItem("token");
            if (!token) return;

            const res = await fetch("/api/notifications", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                notifications = data.notifications;
                renderNotifications();
                updateBadge();
            }
        } catch (err) {
            console.error("Error fetching notifications:", err);
        }
    }

    function updateBadge() {
        const unreadCount = notifications.filter(n => !n.is_read).length;
        const badge = document.getElementById("notificationBadge");
        if (badge) {
            if (unreadCount > 0) {
                badge.innerText = unreadCount > 9 ? "9+" : unreadCount;
                badge.classList.remove("hidden");
            } else {
                badge.classList.add("hidden");
            }
        }
    }

    function renderNotifications() {
        const list = document.getElementById("notificationList");
        if (!list) return;

        if (notifications.length === 0) {
            list.innerHTML = '<div class="empty-notifications">No notifications yet</div>';
            return;
        }

        list.innerHTML = notifications.map(n => `
            <a href="${n.link || '#'}" class="notification-item ${n.is_read ? '' : 'unread'}" data-id="${n.id}">
                <div class="notif-icon-circle">
                    ${n.type === 'message' ? '💬' : n.type === 'trade' ? '🤝' : '🔔'}
                </div>
                <div class="notif-content">
                    <div class="notif-message">${n.message}</div>
                    <div class="notif-time">${timeAgo(new Date(n.created_at))}</div>
                </div>
            </a>
        `).join('');

        // Add click listeners
        list.querySelectorAll('.notification-item').forEach(item => {
            item.onclick = async (e) => {
                const id = item.dataset.id;
                await markAsRead(id);
            };
        });
    }

    async function markAsRead(id) {
        if (!id || id === 'undefined') return;

        // If it's a temporary client-side notification, just update local state and skip API call
        if (String(id).startsWith('temp_')) {
            const notif = notifications.find(n => n.id == id);
            if (notif) notif.is_read = true;
            updateBadge();
            renderNotifications();
            return;
        }

        try {
            const token = localStorage.getItem("token");
            await fetch(`/api/notifications/${id}/read`, {
                method: "PUT",
                headers: { "Authorization": `Bearer ${token}` }
            });
            // Update local state
            const notif = notifications.find(n => n.id == id);
            if (notif) notif.is_read = true;
            updateBadge();
            renderNotifications();
        } catch (err) {
            console.error("Error marking as read:", err);
        }
    }

    async function markAllAsRead() {
        try {
            const token = localStorage.getItem("token");
            await fetch("/api/notifications/read-all", {
                method: "PUT",
                headers: { "Authorization": `Bearer ${token}` }
            });
            notifications.forEach(n => n.is_read = true);
            updateBadge();
            renderNotifications();
        } catch (err) {
            console.error("Error marking all as read:", err);
        }
    }

    function timeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " years ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " months ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " days ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " hours ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " minutes ago";
        return Math.floor(seconds) + " seconds ago";
    }

    // Toggle Dropdown
    window.toggleNotifications = function(e) {
        if (e) e.stopPropagation();
        const dropdown = document.getElementById("notificationDropdown");
        if (dropdown) {
            dropdown.classList.toggle("show");
        }
    };

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        const dropdown = document.getElementById("notificationDropdown");
        const btn = document.getElementById("notificationBtn");
        if (dropdown && !dropdown.contains(e.target) && !btn.contains(e.target)) {
            dropdown.classList.remove("show");
        }
    });

    // Initialize on load
    document.addEventListener("DOMContentLoaded", () => {
        fetchNotifications();
        
        // Setup "Mark all as read" button if it exists
        const markAllBtn = document.getElementById("markAllRead");
        if (markAllBtn) {
            markAllBtn.onclick = markAllAsRead;
        }
    });

    // Handle real-time updates (called from socketClient.js)
    window.addLiveNotification = function(notif) {
        // Add to the top of the list with a temporary ID
        const tempId = `temp_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        notifications.unshift({
            ...notif,
            id: tempId,
            is_read: false,
            created_at: new Date().toISOString()
        });
        // Limit to 10 locally too
        if (notifications.length > 10) notifications.pop();
        
        renderNotifications();
        updateBadge();
        showToast(notif.message, notif.type === 'error' ? 'error' : 'info');
    };

})();
