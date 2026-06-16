const db = require("../config/db");

const MAX_NOTIFICATIONS = 10;

const createNotification = async (userId, message, type = "info", link = null) => {
    try {
        // 1. Insert new notification
        await db.promise().query(
            "INSERT INTO notifications (user_id, message, type, link) VALUES (?, ?, ?, ?)",
            [userId, message, type, link]
        );

        // 2. Keep only the most recent MAX_NOTIFICATIONS
        // First, check the count
        const [rows] = await db.promise().query(
            "SELECT COUNT(*) as count FROM notifications WHERE user_id = ?",
            [userId]
        );

        if (rows[0].count > MAX_NOTIFICATIONS) {
            // Delete oldest notifications exceeding the limit
            const deleteCount = rows[0].count - MAX_NOTIFICATIONS;
            await db.promise().query(
                `DELETE FROM notifications 
                 WHERE user_id = ? 
                 ORDER BY created_at ASC 
                 LIMIT ?`,
                [userId, deleteCount]
            );
        }
        
        return { success: true };
    } catch (err) {
        console.error("Error creating notification:", err);
        throw err;
    }
};

const getNotifications = async (userId) => {
    try {
        const [rows] = await db.promise().query(
            "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC",
            [userId]
        );
        return rows;
    } catch (err) {
        console.error("Error fetching notifications:", err);
        throw err;
    }
};

const markAsRead = async (notificationId, userId) => {
    try {
        await db.promise().query(
            "UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?",
            [notificationId, userId]
        );
        return { success: true };
    } catch (err) {
        console.error("Error marking notification as read:", err);
        throw err;
    }
};

const markAllAsRead = async (userId) => {
    try {
        await db.promise().query(
            "UPDATE notifications SET is_read = TRUE WHERE user_id = ?",
            [userId]
        );
        return { success: true };
    } catch (err) {
        console.error("Error marking all notifications as read:", err);
        throw err;
    }
};

module.exports = {
    createNotification,
    getNotifications,
    markAsRead,
    markAllAsRead
};
