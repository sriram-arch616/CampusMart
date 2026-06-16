const express = require("express");
const router = express.Router();

const productController = require("../controllers/productController");
const { authenticateToken } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const path = require("path");

router.get("/", authenticateToken, productController.getAllProducts);

router.get("/my-products", authenticateToken, productController.getMyProducts);

router.post("/", authenticateToken, upload.single("image"), productController.createProduct);

router.get("/user/:userId", productController.getProductsByUserId);

router.get("/:id", productController.getProductById);

router.put("/:id", authenticateToken, upload.single("image"), productController.updateProduct);

router.delete("/:id", authenticateToken, productController.deleteProduct);

const viewRouter = express.Router();

viewRouter.get("/add-product", (req, res) => {
    res.sendFile(path.join(__dirname, "../../../frontend/addProduct.html"));
});

viewRouter.get("/product/:id", (req, res) => {
    res.sendFile(path.join(__dirname, "../../../frontend/product.html"));
});

module.exports = {
    apiRouter: router,
    viewRouter
};