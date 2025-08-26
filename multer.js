const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('./cloudinary');

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "edu-uploads",
    allowed_formats: ["jpg", "png", "jpeg", "webp", "mp4", "avi", "mov", "wmv", "flv", "webm"],
    resource_type: "auto", // This allows both images and videos
  },
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit for videos
  }
});

module.exports = upload;
