const userService = require("../services/userService");

exports.searchUsers = async (req, res, next) => {
    try {
        const username = req.query.username || "";
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const data = await userService.searchUsers(username, page, limit);
        res.json({ success: true, data: data });
    } catch (error) {
        next(error);
    }
};

exports.deleteUser = async (req, res, next) => {
    try {
        const userId = req.params.id;
        const message = await userService.deleteUser(userId);
        res.json({ success: true, message });
    } catch (error) {
        next(error);
    }
};

exports.getStats = async (req, res, next) => {
    try {
        const stats = await userService.getStats();
        res.json({ success: true, data: stats });
    } catch (error) {
        next(error);
    }
};
