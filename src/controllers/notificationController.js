const notificationService = require("../services/notificationService");

const getNotifications = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const notifications = await notificationService.getNotifications(userId);
        res.json({ success: true, notifications });
    } catch (err) {
        next(err);
    }
};

const markAsRead = async (req, res, next) => {
    try {
        const notificationId = req.params.id;
        if (!notificationId || notificationId === "undefined" || isNaN(Number(notificationId))) {
            return res.status(400).json({ success: false, error: "Invalid notification ID" });
        }
        const userId = req.user.id;
        await notificationService.markAsRead(Number(notificationId), userId);
        res.json({ success: true, message: "Notification marked as read." });
    } catch (err) {
        next(err);
    }
};

const markAllAsRead = async (req, res, next) => {
    try {
        const userId = req.user.id;
        await notificationService.markAllAsRead(userId);
        res.json({ success: true, message: "All notifications marked as read." });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getNotifications,
    markAsRead,
    markAllAsRead
};
