const express = require('express');
const { body } = require('express-validator');
const {
  getInstructors,
  getInstructor,
  createInstructor,
  updateInstructor,
  deleteInstructor,
  getInstructorStats,
  getTopRatedInstructors,
  updateInstructorRating
} = require('../controllers/instructorController');

// Import middleware (you'll need to create these or adjust based on your auth setup)
// const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const instructorValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('bio')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Bio cannot exceed 1000 characters'),
  body('experience')
    .optional()
    .isInt({ min: 0, max: 50 })
    .withMessage('Experience must be between 0 and 50 years'),
  body('profileImage')
    .optional()
    .custom((value) => {
      if (!value) return true; // Allow empty string
      // Accept both full URLs and relative paths
      const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
      const pathRegex = /^\/[\w\/-]+\.(jpg|jpeg|png|gif|webp)$/i;
      if (urlRegex.test(value) || pathRegex.test(value)) {
        return true;
      }
      throw new Error('Profile image must be a valid URL or path');
    }),
  body('specializations')
    .optional()
    .isArray()
    .withMessage('Specializations must be an array'),
  body('socialLinks.linkedin')
    .optional()
    .isURL()
    .withMessage('LinkedIn URL must be valid'),
  body('socialLinks.github')
    .optional()
    .isURL()
    .withMessage('GitHub URL must be valid'),
  body('socialLinks.website')
    .optional()
    .isURL()
    .withMessage('Website URL must be valid')
];

const ratingValidation = [
  body('rating')
    .isFloat({ min: 0, max: 5 })
    .withMessage('Rating must be between 0 and 5'),
  body('totalStudents')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Total students must be a non-negative number')
];

// Public routes
router.get('/', getInstructors);
router.get('/top-rated', getTopRatedInstructors);
router.get('/:id', getInstructor);
router.get('/:id/stats', getInstructorStats);

// Protected routes (uncomment and adjust based on your auth setup)
// Admin only routes
router.post('/', instructorValidation, createInstructor);
router.put('/:id', instructorValidation, updateInstructor);
router.delete('/:id', deleteInstructor);

// Instructor or admin routes
router.put('/:id/rating', ratingValidation, updateInstructorRating);

// Alternative routes with authentication (comment out the above and uncomment these if you have auth middleware)
/*
// Admin only routes
router.post('/', protect, authorize('admin'), instructorValidation, createInstructor);
router.put('/:id', protect, authorize('admin'), instructorValidation, updateInstructor);
router.delete('/:id', protect, authorize('admin'), deleteInstructor);

// Instructor or admin routes
router.put('/:id/rating', protect, authorize('instructor', 'admin'), ratingValidation, updateInstructorRating);
*/

module.exports = router;