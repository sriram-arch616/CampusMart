const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

if (!process.env.CLOUDINARY_CLOUD_NAME && !process.env.CLOUDINARY_URL) {
    console.warn("⚠️ WARNING: Cloudinary credentials (CLOUDINARY_CLOUD_NAME, etc.) are missing from environment variables!");
}

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: "campusmarketplace",
        transformation: [{ width: 800, height: 800, crop: "limit" }],
    },
});

const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5 MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image/")) {
            cb(null, true);
        } else {
            cb(new Error("Not an image! Please upload an image."), false);
        }
    }
});

/**
 * Deletes an image from Cloudinary using its URL.
 * @param {string} imageUrl - The full URL of the image on Cloudinary.
 */
const deleteImage = async (imageUrl) => {
    if (!imageUrl) return;

    try {
        // Extract public_id from the URL
        // Example: https://res.cloudinary.com/cloudname/image/upload/v12345/folder/public_id.jpg
        const parts = imageUrl.split("/");
        const filenameWithExtension = parts.pop(); // public_id.jpg
        const publicIdWithoutExtension = filenameWithExtension.split(".")[0];

        // If there's a folder, it's the second to last part
        // Note: Simple version assuming 'campusmarketplace' folder as per current config
        const folder = parts.includes("campusmarketplace") ? "campusmarketplace/" : "";
        const publicId = folder + publicIdWithoutExtension;

        await cloudinary.uploader.destroy(publicId);
        console.log(`Deleted image from Cloudinary: ${publicId}`);
    } catch (err) {
        console.error("Error deleting image from Cloudinary:", err);
    }
};

module.exports = { cloudinary, upload, deleteImage };
