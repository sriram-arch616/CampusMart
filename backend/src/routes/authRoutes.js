const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const { authLimiter } = require("../middleware/rateLimiter");
const { authenticateToken } = require("../middleware/authMiddleware");

router.post("/register", authLimiter, authController.register);
router.post("/verify-email", authLimiter, authController.verifyEmail);
router.post("/login", authLimiter, authController.login);
router.post("/logout", authController.logout);
router.post("/forgot-password", authLimiter, authController.forgotPassword);
router.post("/reset-password", authLimiter, authController.resetPassword);

router.get("/protected", authenticateToken, (req, res) => {
    res.json({ message: "You are authorized!", user: req.user });
});

module.exports = router;