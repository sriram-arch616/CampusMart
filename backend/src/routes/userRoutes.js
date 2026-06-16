const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { authenticateToken } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const path = require("path");

router.get("/profile", authenticateToken, userController.getProfile);
router.put("/profile", authenticateToken, upload.single("profile_pic"), userController.updateProfile);
router.get("/profile/:id", userController.getPublicProfile);

const viewRouter = express.Router();

viewRouter.get("/user/:id", (req, res) => {
    res.sendFile(path.join(__dirname, "../../../frontend/user-profile.html"));
});

module.exports = {
    apiRouter: router,
    viewRouter
};
