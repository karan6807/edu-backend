// routes/instructorRoutes.js
const express = require('express');
const router = express.Router();
const Instructor = require('../models/Instructor');
const Course = require('../models/Course');

// GET /api/instructors - Get all instructors
router.get('/', async (req, res) => {
  try {
    const instructors = await Instructor.find({ isActive: true })
      .select('-__v')
      .sort({ rating: -1, totalStudents: -1 });
    
    res.json(instructors);
  } catch (error) {
    console.error('Error fetching instructors:', error);
    res.status(500).json({ message: 'Server error while fetching instructors' });
  }
});

// GET /api/instructors/search - Search instructor by name
router.get('/search', async (req, res) => {
  try {
    const { name } = req.query;
    
    if (!name) {
      return res.status(400).json({ message: 'Name parameter is required' });
    }

    // Search for instructor by name (case-insensitive)
    const instructor = await Instructor.findOne({ 
      name: { $regex: new RegExp(name.trim(), 'i') },
      isActive: true 
    }).select('-__v');

    if (!instructor) {
      return res.status(404).json({ message: 'Instructor not found' });
    }

    res.json(instructor);
  } catch (error) {
    console.error('Error searching instructor:', error);
    res.status(500).json({ message: 'Server error while searching instructor' });
  }
});

// GET /api/instructors/:id - Get specific instructor
router.get('/:id', async (req, res) => {
  try {
    const instructor = await Instructor.findById(req.params.id)
      .select('-__v')
      .populate('courses', 'title description price thumbnailUrl');

    if (!instructor) {
      return res.status(404).json({ message: 'Instructor not found' });
    }

    res.json(instructor);
  } catch (error) {
    console.error('Error fetching instructor:', error);
    res.status(500).json({ message: 'Server error while fetching instructor' });
  }
});

// GET /api/instructors/:id/courses - Get courses by specific instructor
router.get('/:id/courses', async (req, res) => {
  try {
    const instructor = await Instructor.findById(req.params.id);
    
    if (!instructor) {
      return res.status(404).json({ message: 'Instructor not found' });
    }

    // Find courses by instructor name (since Course model stores instructor as string)
    const courses = await Course.find({ 
      instructor: instructor.name,
      isPublished: true 
    }).select('-__v');

    res.json(courses);
  } catch (error) {
    console.error('Error fetching instructor courses:', error);
    res.status(500).json({ message: 'Server error while fetching instructor courses' });
  }
});

// POST /api/instructors - Create new instructor
router.post('/', async (req, res) => {
  try {
    const {
      name,
      email,
      bio,
      specializations,
      experience,
      profileImage,
      socialLinks
    } = req.body;

    // Check if instructor with email already exists
    const existingInstructor = await Instructor.findOne({ email });
    if (existingInstructor) {
      return res.status(400).json({ message: 'Instructor with this email already exists' });
    }

    const instructor = new Instructor({
      name,
      email,
      bio,
      specializations,
      experience,
      profileImage,
      socialLinks
    });

    await instructor.save();
    res.status(201).json(instructor);
  } catch (error) {
    console.error('Error creating instructor:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error while creating instructor' });
  }
});

// PUT /api/instructors/:id - Update instructor
router.put('/:id', async (req, res) => {
  try {
    const instructor = await Instructor.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!instructor) {
      return res.status(404).json({ message: 'Instructor not found' });
    }

    res.json(instructor);
  } catch (error) {
    console.error('Error updating instructor:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error while updating instructor' });
  }
});

// DELETE /api/instructors/:id - Delete instructor (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const instructor = await Instructor.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!instructor) {
      return res.status(404).json({ message: 'Instructor not found' });
    }

    res.json({ message: 'Instructor deleted successfully' });
  } catch (error) {
    console.error('Error deleting instructor:', error);
    res.status(500).json({ message: 'Server error while deleting instructor' });
  }
});

// GET /api/instructors/:id/stats - Get instructor statistics
router.get('/:id/stats', async (req, res) => {
  try {
    const instructor = await Instructor.findById(req.params.id);
    
    if (!instructor) {
      return res.status(404).json({ message: 'Instructor not found' });
    }

    // Get course count
    const courseCount = await Course.countDocuments({ 
      instructor: instructor.name,
      isPublished: true 
    });

    // Calculate total students (this would need to be updated based on enrollment data)
    const totalStudents = instructor.totalStudents || 0;

    const stats = {
      totalCourses: courseCount,
      totalStudents,
      rating: instructor.rating,
      experience: instructor.experience,
      specializations: instructor.specializations.length,
      dateJoined: instructor.dateJoined
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching instructor stats:', error);
    res.status(500).json({ message: 'Server error while fetching instructor stats' });
  }
});

module.exports = router;