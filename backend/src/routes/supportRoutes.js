const express = require("express");
const router = express.Router();
const supportController = require("../controllers/supportController");
const { authenticateToken } = require("../middleware/authMiddleware");
const { supportLimiter } = require("../middleware/rateLimiter");

// All support routes require authentication
router.post("/message", authenticateToken, supportLimiter, supportController.submitMessage);

module.exports = router;
