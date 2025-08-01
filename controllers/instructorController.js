const Instructor = require('../models/Instructor');
const { validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs');

// @desc    Get all instructors
// @route   GET /api/instructors
// @access  Public
const getInstructors = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const { search, specialization, sortBy, order } = req.query;
    
    // Build query
    let query = { isActive: true };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (specialization) {
      query.specializations = { $in: [new RegExp(specialization, 'i')] };
    }
    
    // Build sort
    let sort = {};
    if (sortBy) {
      sort[sortBy] = order === 'desc' ? -1 : 1;
    } else {
      sort.createdAt = -1; // Default sort by creation date
    }
    
    const instructors = await Instructor.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('courses', 'title');
    
    const total = await Instructor.countDocuments(query);
    
    res.status(200).json({
      success: true,
      data: instructors,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching instructors:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching instructors'
    });
  }
};

// @desc    Get single instructor
// @route   GET /api/instructors/:id
// @access  Public
const getInstructor = async (req, res) => {
  try {
    const instructor = await Instructor.findById(req.params.id)
      .populate('courses', 'title description students');
    
    if (!instructor) {
      return res.status(404).json({
        success: false,
        message: 'Instructor not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: instructor
    });
  } catch (error) {
    console.error('Error fetching instructor:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid instructor ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while fetching instructor'
    });
  }
};

// @desc    Create new instructor
// @route   POST /api/instructors
// @access  Private/Admin
const createInstructor = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }
    
    const { name, email, bio, specializations, experience, profileImage, socialLinks } = req.body;
    
    // Check if instructor with email already exists
    const existingInstructor = await Instructor.findOne({ email });
    if (existingInstructor) {
      return res.status(400).json({
        success: false,
        message: 'Instructor with this email already exists'
      });
    }
    
    // Create instructor
    const instructor = await Instructor.create({
      name,
      email,
      bio,
      specializations: Array.isArray(specializations) ? specializations : [],
      experience: parseInt(experience) || 0,
      profileImage,
      socialLinks
    });
    
    res.status(201).json({
      success: true,
      data: instructor,
      message: 'Instructor created successfully'
    });
  } catch (error) {
    console.error('Error creating instructor:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Instructor with this email already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while creating instructor'
    });
  }
};

// @desc    Update instructor
// @route   PUT /api/instructors/:id
// @access  Private/Admin
const updateInstructor = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }
    
    const { name, email, bio, specializations, experience, profileImage, socialLinks, isActive } = req.body;
    
    // Check if instructor exists
    const instructor = await Instructor.findById(req.params.id);
    if (!instructor) {
      return res.status(404).json({
        success: false,
        message: 'Instructor not found'
      });
    }
    
    // Check if email is being changed and if it's already taken
    if (email && email !== instructor.email) {
      const existingInstructor = await Instructor.findOne({ email });
      if (existingInstructor) {
        return res.status(400).json({
          success: false,
          message: 'Instructor with this email already exists'
        });
      }
    }
    
    // If we're updating with a new profile image and old one exists, clean up old image
    if (profileImage && instructor.profileImage && instructor.profileImage !== profileImage) {
      const oldImagePath = path.join(__dirname, '..', 'uploads', path.basename(instructor.profileImage));
      if (fs.existsSync(oldImagePath)) {
        try {
          fs.unlinkSync(oldImagePath);
        } catch (err) {
          console.error('Error deleting old image:', err);
        }
      }
    }
    
    // Update instructor
    const updatedInstructor = await Instructor.findByIdAndUpdate(
      req.params.id,
      {
        name,
        email,
        bio,
        specializations: Array.isArray(specializations) ? specializations : [],
        experience: parseInt(experience) || 0,
        profileImage,
        socialLinks,
        isActive
      },
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      data: updatedInstructor,
      message: 'Instructor updated successfully'
    });
  } catch (error) {
    console.error('Error updating instructor:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid instructor ID format'
      });
    }
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Instructor with this email already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while updating instructor'
    });
  }
};

// @desc    Delete instructor
// @route   DELETE /api/instructors/:id
// @access  Private/Admin
const deleteInstructor = async (req, res) => {
  try {
    const instructor = await Instructor.findById(req.params.id);
    
    if (!instructor) {
      return res.status(404).json({
        success: false,
        message: 'Instructor not found'
      });
    }
    
    // Clean up profile image if it exists
    if (instructor.profileImage) {
      const imagePath = path.join(__dirname, '..', 'uploads', path.basename(instructor.profileImage));
      if (fs.existsSync(imagePath)) {
        try {
          fs.unlinkSync(imagePath);
        } catch (err) {
          console.error('Error deleting image:', err);
        }
      }
    }
    
    // Soft delete - set isActive to false
    await Instructor.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    
    res.status(200).json({
      success: true,
      message: 'Instructor deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting instructor:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid instructor ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while deleting instructor'
    });
  }
};

// @desc    Get instructor stats
// @route   GET /api/instructors/:id/stats
// @access  Public
const getInstructorStats = async (req, res) => {
  try {
    const instructor = await Instructor.findById(req.params.id);
    
    if (!instructor) {
      return res.status(404).json({
        success: false,
        message: 'Instructor not found'
      });
    }
    
    const stats = instructor.getStats();
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching instructor stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching instructor stats'
    });
  }
};

// @desc    Get top-rated instructors
// @route   GET /api/instructors/top-rated
// @access  Public
const getTopRatedInstructors = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const instructors = await Instructor.getTopRated(limit);
    
    res.status(200).json({
      success: true,
      data: instructors
    });
  } catch (error) {
    console.error('Error fetching top-rated instructors:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching top-rated instructors'
    });
  }
};

// @desc    Update instructor rating
// @route   PUT /api/instructors/:id/rating
// @access  Private
const updateInstructorRating = async (req, res) => {
  try {
    const { rating, totalStudents } = req.body;
    
    const instructor = await Instructor.findByIdAndUpdate(
      req.params.id,
      { 
        rating: parseFloat(rating) || 0,
        totalStudents: parseInt(totalStudents) || 0
      },
      { new: true, runValidators: true }
    );
    
    if (!instructor) {
      return res.status(404).json({
        success: false,
        message: 'Instructor not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: instructor,
      message: 'Instructor rating updated successfully'
    });
  } catch (error) {
    console.error('Error updating instructor rating:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating instructor rating'
    });
  }
};

module.exports = {
  getInstructors,
  getInstructor,
  createInstructor,
  updateInstructor,
  deleteInstructor,
  getInstructorStats,
  getTopRatedInstructors,
  updateInstructorRating
};