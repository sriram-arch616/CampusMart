const userService = require("../services/userService");
const { deleteImage } = require("../config/cloudinary");
const fs = require("fs");
const path = require("path");

exports.getProfile = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const profile = await userService.getUserProfile(userId);
        res.status(200).json({ success: true, data: profile });
    } catch (error) {
        next(error);
    }
};

exports.getPublicProfile = async (req, res, next) => {
    try {
        const userId = req.params.id;
        const profile = await userService.getPublicProfile(userId);
        res.status(200).json({ success: true, data: profile });
    } catch (error) {
        next(error);
    }
};

exports.updateProfile = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const profileData = { ...req.body };

        // If an image was uploaded, store the path
        if (req.file) {
            // Get old profile to delete old pic
            const oldProfile = await userService.getUserProfile(userId);
            if (oldProfile && oldProfile.profile_pic) {
                if (oldProfile.profile_pic.startsWith("http")) {
                    await deleteImage(oldProfile.profile_pic);
                } else if (oldProfile.profile_pic.startsWith("/uploads/")) {
                    const localPath = path.join(__dirname, "../../../frontend", oldProfile.profile_pic);
                    if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
                }
            }
            profileData.profile_pic = req.file.path || `/uploads/${req.file.filename}`;
        }

        const message = await userService.updateUserProfile(userId, profileData);
        res.status(200).json({ success: true, message });
    } catch (error) {
        next(error);
    }
};
