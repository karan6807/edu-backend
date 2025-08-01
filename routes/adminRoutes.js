const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const adminController = require('../controllers/adminController');
const adminAuthenticate = require('../middleware/adminMiddleware');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.fieldname === 'thumbnail') {
            if (file.mimetype.startsWith('image/')) {
                cb(null, true);
            } else {
                cb(new Error('Thumbnail must be an image file'), false);
            }
        } else if (file.fieldname === 'videoUrl') {
            if (file.mimetype.startsWith('video/')) {
                cb(null, true);
            } else {
                cb(new Error('Video file must be a video format'), false);
            }
        } else {
            cb(new Error('Unexpected field'), false);
        }
    }
});

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