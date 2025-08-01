const express = require("express");
const router = express.Router();
const {
    addToFavorites,
    getFavorites,
    removeFromFavorites,
    clearFavorites,
    checkFavoriteStatus
} = require("../controllers/favoriteController");
const authenticate = require("../middleware/authMiddleware");

// @route   GET /api/favorites
// @desc    Get user's favorite courses
// @access  Private
router.get("/", authenticate, getFavorites);

// @route   POST /api/favorites
// @desc    Add course to favorites
// @access  Private
router.post("/", authenticate, addToFavorites);

// @route   GET /api/favorites/check/:courseId
// @desc    Check if course is in user's favorites
// @access  Private
router.get("/check/:courseId", authenticate, checkFavoriteStatus);

// @route   DELETE /api/favorites/:courseId
// @desc    Remove course from favorites
// @access  Private
router.delete("/:courseId", authenticate, removeFromFavorites);

// @route   DELETE /api/favorites
// @desc    Clear all favorites
// @access  Private
router.delete("/", authenticate, clearFavorites);

module.exports = router;