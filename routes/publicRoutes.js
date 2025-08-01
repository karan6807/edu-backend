const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// ✅ Public route — no adminAuthenticate
router.get('/categories', adminController.getAllCategories);

// Optional: if you want to show courses to users
router.get('/courses', adminController.getAllCourses);

router.get('/courses/:id', adminController.getCourseById);

module.exports = router;
