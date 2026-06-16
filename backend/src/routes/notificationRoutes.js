const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/authMiddleware");
const notificationController = require("../controllers/notificationController");

router.get("/", authenticateToken, notificationController.getNotifications);
router.put("/:id/read", authenticateToken, notificationController.markAsRead);
router.put("/read-all", authenticateToken, notificationController.markAllAsRead);

module.exports = router;
