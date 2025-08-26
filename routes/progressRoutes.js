const express = require('express');
const router = express.Router();
const { saveProgress, getProgress, getUserProgress } = require('../controllers/progressController');
const authMiddleware = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authMiddleware);

// Save/update progress
router.post('/', saveProgress);

// Get progress for specific course
router.get('/:courseId', getProgress);

// Get all user progress
router.get('/user/all', getUserProgress);

module.exports = router;