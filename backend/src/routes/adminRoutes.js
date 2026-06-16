const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const supportController = require("../controllers/supportController");
const { authenticateToken, isAdmin } = require("../middleware/authMiddleware");

// All admin routes require authentication and admin role
router.use(authenticateToken, isAdmin);

// User management
router.get("/users/search", adminController.searchUsers);
router.delete("/users/:id", adminController.deleteUser);

// Support message management
router.get("/support/messages", supportController.getAllMessages);
router.put("/support/messages/:id", supportController.updateStatus);

// Dashboard stats
router.get("/stats", adminController.getStats);

module.exports = router;
