const express = require("express");
const router = express.Router();
const {
    addToCart,
    getCart,
    removeFromCart,
    clearCart
} = require("../controllers/cartController");
const authenticate = require("../middleware/authMiddleware");

// @route   GET /api/cart
// @desc    Get user's cart items
// @access  Private
router.get("/", authenticate, getCart);

// @route   POST /api/cart
// @desc    Add course to cart
// @access  Private
router.post("/", authenticate, addToCart);

// @route   DELETE /api/cart/:courseId
// @desc    Remove course from cart
// @access  Private
router.delete("/:courseId", authenticate, removeFromCart);

// @route   DELETE /api/cart
// @desc    Clear entire cart
// @access  Private
router.delete("/", authenticate, clearCart);

module.exports = router;