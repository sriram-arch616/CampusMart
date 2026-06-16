const productService = require("../services/productService");
const { isValidPrice, isValidString } = require("../utils/validators");
const { deleteImage } = require("../config/cloudinary");
const fs = require("fs");
const path = require("path");

exports.getAllProducts = async (req, res, next) => {
    try {
        const filters = {
            search: req.query.search,
            category: req.query.category,
            excludeSellerId: req.user ? req.user.id : null,
            minPrice: req.query.minPrice ? parseFloat(req.query.minPrice) : null,
            maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice) : null,
            type: req.query.type,
            timeframe: req.query.timeframe,
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 12
        };

        const result = await productService.getAllProducts(filters);
        res.json({
            success: true,
            data: result.products,
            pagination: {
                currentPage: result.currentPage,
                totalPages: result.totalPages,
                totalProducts: result.totalProducts
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.getMyProducts = async (req, res, next) => {
    try {
        const seller_id = req.user.id;
        const products = await productService.getMyProducts(seller_id);
        res.json({ success: true, data: products });
    } catch (error) {
        next(error);
    }
};

exports.getProductById = async (req, res, next) => {
    try {
        const id = req.params.id;
        const product = await productService.getProductById(id);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }
        res.json({ success: true, data: product });
    } catch (error) {
        next(error);
    }
};

exports.createProduct = async (req, res, next) => {
    try {
        const seller_id = req.user.id;
        const productData = { ...req.body };

        // Manual Validation
        if (!isValidString(productData.title, 5, 200)) {
            return res.status(400).json({ success: false, message: "Title must be 5-200 characters long." });
        }
        if (!isValidPrice(productData.price)) {
            return res.status(400).json({ success: false, message: "Invalid price. Must be a positive number." });
        }
        if (!isValidString(productData.category, 2, 50)) {
            return res.status(400).json({ success: false, message: "Category is required." });
        }

        if (req.file) {
            productData.image_url = req.file.path || `/uploads/${req.file.filename}`;
        } else {
            productData.image_url = null;
        }

        const productId = await productService.createProduct(productData, seller_id);
        res.status(201).json({ success: true, message: "Product created successfuly", id: productId });
    } catch (error) {
        next(error);
    }
};

exports.updateProduct = async (req, res, next) => {
    try {
        const seller_id = req.user.id;
        const id = req.params.id;
        const productData = { ...req.body };

        // Optional Validation (if updating)
        if (productData.title && !isValidString(productData.title, 5, 200)) {
            return res.status(400).json({ success: false, message: "Title must be 5-200 characters long." });
        }
        if (productData.price && !isValidPrice(productData.price)) {
            return res.status(400).json({ success: false, message: "Invalid price." });
        }

        if (req.file) {
            // Get old product info to delete old image if needed
            const oldProduct = await productService.getProductById(id);
            if (oldProduct && oldProduct.image_url) {
                if (oldProduct.image_url.startsWith("http")) {
                    await deleteImage(oldProduct.image_url);
                } else {
                    const localPath = path.join(__dirname, "../../../frontend", oldProduct.image_url);
                    if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
                }
            }
            productData.image_url = req.file.path || `/uploads/${req.file.filename}`;
        }

        const message = await productService.updateProduct(id, productData, seller_id);
        res.json({ success: true, message });
    } catch (error) {
        next(error);
    }
};

exports.deleteProduct = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const isAdmin = req.user.role === 'admin';
        const id = req.params.id;

        // 1. Fetch product to get its image_url
        const product = await productService.getProductById(id);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        // 2. Check ownership OR admin status
        if (product.seller_id !== userId && !isAdmin) {
            return res.status(403).json({ success: false, message: "Unauthorized to delete this product" });
        }

        // 3. Delete from database
        const message = await productService.deleteProduct(id, userId, isAdmin);

        // 4. Cleanup storage AFTER DB deletion to be safe (or before if we are confident)
        if (product.image_url) {
            if (product.image_url.startsWith("http")) {
                // Cloudinary cleanup
                await deleteImage(product.image_url);
            } else if (product.image_url.startsWith("/uploads/")) {
                // Local disk cleanup
                const localPath = path.join(__dirname, "../../../frontend", product.image_url);
                if (fs.existsSync(localPath)) {
                    fs.unlinkSync(localPath);
                    console.log(`Deleted local image: ${localPath}`);
                }
            }
        }

        res.json({ success: true, message });
    } catch (error) {
        next(error);
    }
};

exports.getProductsByUserId = async (req, res, next) => {
    try {
        const userId = req.params.userId;
        const products = await productService.getProductsByUserId(userId);
        res.json({ success: true, data: products });
    } catch (error) {
        next(error);
    }
};