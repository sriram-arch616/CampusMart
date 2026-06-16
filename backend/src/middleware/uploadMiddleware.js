const multer = require("multer");
const path = require("path");

let upload;

if (process.env.NODE_ENV === "production") {
    // In production, use Cloudinary storage
    const { upload: cloudinaryUpload } = require("../config/cloudinary");
    upload = cloudinaryUpload;
} else {
    // In development, use local disk storage
    const storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, path.join(__dirname, "../../../frontend/uploads/"));
        },
        filename: function (req, file, cb) {
            cb(null, Date.now() + path.extname(file.originalname));
        }
    });

    const fileFilter = (req, file, cb) => {
        if (file.mimetype.startsWith("image/")) {
            cb(null, true);
        } else {
            cb(new Error("Not an image! Please upload an image."), false);
        }
    };

    upload = multer({
        storage: storage,
        fileFilter: fileFilter,
        limits: {
            fileSize: 5 * 1024 * 1024 // 5 MB limit
        }
    });
}

module.exports = upload;
