const express = require('express');
const router = express.Router();
const upload = require('../multer'); // Use Cloudinary multer config
const adminController = require('../controllers/adminController');
const adminAuthenticate = require('../middleware/adminMiddleware');

// ✅ LOGIN ROUTE FIRST (before authentication middleware)
router.post('/login', adminController.adminLogin);

// ✅ THEN apply auth middleware to protect other routes
router.use(adminAuthenticate);

// ✅ Protected routes below
router.get('/dashboard-stats', adminController.getDashboardStats);

// Course management routes
router.post('/add-course', upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'videoUrl', maxCount: 1 }
]), adminController.addCourse);

router.post('/courses', upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'videoUrl', maxCount: 1 }
]), adminController.addCourse);

router.get('/courses', adminController.getAllCourses);
router.get('/courses/:id', adminController.getCourseById);
router.put('/courses/:id', adminController.updateCourse);
router.delete('/courses/:id', adminController.deleteCourse);

// Category management routes
router.get('/categories', adminController.getAllCategories);
router.post('/categories', adminController.addCategory);
router.put('/categories/:id', adminController.updateCategory);
router.delete('/categories/:id', adminController.deleteCategory);
router.get('/categories/tree', adminController.getCategoryTree);

module.exports = router;