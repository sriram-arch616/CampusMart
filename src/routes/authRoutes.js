const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const { authLimiter } = require("../middleware/rateLimiter");

router.post("/register", authLimiter, authController.register);
router.post("/verify-email", authLimiter, authController.verifyEmail);
router.post("/login", authLimiter, authController.login);
router.post("/forgot-password", authLimiter, authController.forgotPassword);
router.post("/reset-password", authLimiter, authController.resetPassword);

module.exports = router;