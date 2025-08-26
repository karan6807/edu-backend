const express = require("express");
const router = express.Router();
const {
    registerUser,
    verifyOtp,
    loginUser,
    forgotPassword,
    resetPassword,
    getProfile,
} = require("../controllers/authController");

const { addToCart } = require("../controllers/cartController"); // ✅ Make sure this controller exists
const authenticate = require("../middleware/authMiddleware");

// User Auth Routes
router.post("/signup", registerUser);              // POST /api/user/signup
router.post("/verify-otp", verifyOtp);             // POST /api/user/verify-otp
router.post("/login", loginUser);                  // POST /api/user/login
router.post("/forgot-password", forgotPassword);   // POST /api/user/forgot-password
router.post("/reset-password/:token", resetPassword); // POST /api/user/reset-password/:token
router.get("/profile", authenticate, getProfile);  // GET /api/user/profile (protected)
// Enrollment routes moved to /api/enrollments
router.post("/cart", authenticate, addToCart);     // ✅ POST /api/user/cart (protected)

module.exports = router;
