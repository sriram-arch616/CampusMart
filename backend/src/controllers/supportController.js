const db = require("../config/db");

const supportController = {
    submitMessage: async (req, res, next) => {
        try {
            const { message } = req.body;
            const userId = req.user.id;

            if (!message || message.trim() === "") {
                const error = new Error("Message cannot be empty.");
                error.status = 400;
                return next(error);
            }

            const sql = "INSERT INTO support_messages (user_id, message) VALUES (?, ?)";
            
            db.query(sql, [userId, message], (err, result) => {
                if (err) return next(err);
                
                res.json({
                    success: true,
                    message: "Your message has been sent to the admin successfully.",
                    messageId: result.insertId
                });
            });
        } catch (err) {
            next(err);
        }
    },

    getAllMessages: async (req, res, next) => {
        try {
            const sql = `
                SELECT s.id, s.message, s.status, s.created_at, u.username, u.email 
                FROM support_messages s 
                JOIN users u ON s.user_id = u.id 
                ORDER BY s.created_at DESC
            `;
            db.query(sql, (err, results) => {
                if (err) return next(err);
                res.json({ success: true, data: results });
            });
        } catch (error) {
            next(error);
        }
    },

    updateStatus: async (req, res, next) => {
        try {
            const { id } = req.params;
            const { status } = req.body;

            if (!["pending", "resolved"].includes(status)) {
                return res.status(400).json({ success: false, message: "Invalid status" });
            }

            const sql = "UPDATE support_messages SET status = ? WHERE id = ?";
            db.query(sql, [status, id], (err, result) => {
                if (err) return next(err);
                if (result.affectedRows === 0) return res.status(404).json({ success: false, message: "Message not found" });
                res.json({ success: true, message: "Status updated successfully" });
            });
        } catch (error) {
            next(error);
        }
    }
};

module.exports = supportController;
