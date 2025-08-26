const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');

// Enroll user in a free course
const enrollInFreeCourse = async (req, res) => {
  try {
    const { courseId } = req.body;
    const userId = req.user._id;

    // Check if course exists and is free
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    if (course.price > 0) {
      return res.status(400).json({
        success: false,
        message: 'This is a paid course. Please purchase it first.'
      });
    }

    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
      user: userId,
      course: courseId
    });

    if (existingEnrollment) {
      return res.json({
        success: true,
        message: 'Already enrolled in this course',
        enrollment: existingEnrollment
      });
    }

    // Create new enrollment
    const enrollment = new Enrollment({
      user: userId,
      course: courseId,
      enrollmentType: 'free'
    });

    await enrollment.save();

    res.json({
      success: true,
      message: 'Successfully enrolled in free course',
      enrollment
    });

  } catch (error) {
    console.error('Error enrolling in free course:', error);
    res.status(500).json({
      success: false,
      message: 'Error enrolling in course',
      error: error.message
    });
  }
};

// Get user's enrollments
const getUserEnrollments = async (req, res) => {
  try {
    const userId = req.user._id;

    const enrollments = await Enrollment.find({ user: userId, isActive: true })
      .populate('course')
      .sort({ enrolledAt: -1 });

    res.json({
      success: true,
      enrollments
    });

  } catch (error) {
    console.error('Error fetching enrollments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching enrollments',
      error: error.message
    });
  }
};

module.exports = {
  enrollInFreeCourse,
  getUserEnrollments
};