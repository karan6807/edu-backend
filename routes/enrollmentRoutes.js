const express = require('express');
const router = express.Router();
const { enrollInFreeCourse, getUserEnrollments } = require('../controllers/enrollmentController');
const authMiddleware = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authMiddleware);

// Enroll in free course
router.post('/enroll', enrollInFreeCourse);

// Get user enrollments
router.get('/user', getUserEnrollments);

module.exports = router;