const upload = require('../multer');
const cloudinary = require('../cloudinary');

// @desc    Upload single image
// @route   POST /api/upload
// @access  Public
const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Cloudinary automatically uploads and returns the URL
    const imageUrl = req.file.path; // Cloudinary URL
    
    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      imageUrl: imageUrl,
      publicId: req.file.filename // Cloudinary public_id
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while uploading image'
    });
  }
};

// @desc    Delete image
// @route   DELETE /api/upload/:publicId
// @access  Public
const deleteImage = async (req, res) => {
  try {
    const { publicId } = req.params;
    
    // Delete from Cloudinary
    const result = await cloudinary.uploader.destroy(publicId);
    
    if (result.result === 'ok') {
      res.status(200).json({
        success: true,
        message: 'Image deleted successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting image'
    });
  }
};

// @desc    Upload multiple images
// @route   POST /api/upload/multiple
// @access  Public
const uploadMultipleImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const imageUrls = req.files.map(file => file.path); // Cloudinary URLs
    
    res.status(200).json({
      success: true,
      message: 'Images uploaded successfully',
      imageUrls: imageUrls,
      publicIds: req.files.map(file => file.filename) // Cloudinary public_ids
    });
  } catch (error) {
    console.error('Error uploading images:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while uploading images'
    });
  }
};

module.exports = {
  upload,
  uploadImage,
  deleteImage,
  uploadMultipleImages
};