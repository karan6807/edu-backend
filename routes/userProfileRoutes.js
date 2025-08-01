const express = require("express");
const router = express.Router();
const { getUserProfile, updateUserProfile } = require("../controllers/userProfileController");
const authenticate = require("../middleware/authMiddleware");

// Profile Routes
router.get("/profile", authenticate, getUserProfile);    // GET /api/user-profile/profile
router.put("/profile", authenticate, updateUserProfile); // PUT /api/user-profile/profile

module.exports = router;