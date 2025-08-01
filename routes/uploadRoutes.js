const express = require('express');
const router = express.Router();
const { upload, uploadImage, deleteImage, uploadMultipleImages } = require('../controllers/uploadController');

// @route   POST /api/upload
// @desc    Upload single image
// @access  Public
router.post('/', upload.single('image'), uploadImage);

// @route   POST /api/upload/multiple
// @desc    Upload multiple images
// @access  Public
router.post('/multiple', upload.array('images', 10), uploadMultipleImages);

// @route   DELETE /api/upload/:filename
// @desc    Delete image
// @access  Public
router.delete('/:filename', deleteImage);

module.exports = router;