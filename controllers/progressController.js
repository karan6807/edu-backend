const Progress = require('../models/Progress');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');

// Save or update video progress
const saveProgress = async (req, res) => {
  try {
    const { courseId, currentTime, duration } = req.body;
    const userId = req.user._id;

    // Validate input
    if (!courseId || currentTime === undefined || !duration) {
      return res.status(400).json({
        success: false,
        message: 'Course ID, current time, and duration are required'
      });
    }

    // Calculate percentage
    const percentage = Math.min(Math.round((currentTime / duration) * 100), 100);
    const isCompleted = percentage >= 90; // Mark as completed at 90%

    // Auto-enroll user in free course when they start watching
    const course = await Course.findById(courseId);
    if (course && course.price === 0) {
      try {
        await Enrollment.findOneAndUpdate(
          { user: userId, course: courseId },
          { 
            user: userId, 
            course: courseId, 
            enrollmentType: 'free',
            enrolledAt: new Date(),
            isActive: true
          },
          { upsert: true, new: true }
        );
      } catch (enrollError) {
        console.log('Enrollment already exists or error:', enrollError.message);
      }
    }

    // Find existing progress or create new
    let progress = await Progress.findOne({ user: userId, course: courseId });

    if (progress) {
      // Update existing progress
      progress.currentTime = currentTime;
      progress.duration = duration;
      progress.percentage = percentage;
      progress.isCompleted = isCompleted;
      progress.lastWatched = new Date();
      await progress.save();
    } else {
      // Create new progress
      progress = new Progress({
        user: userId,
        course: courseId,
        currentTime,
        duration,
        percentage,
        isCompleted,
        lastWatched: new Date()
      });
      await progress.save();
    }

    res.json({
      success: true,
      message: 'Progress saved successfully',
      progress: {
        currentTime: progress.currentTime,
        duration: progress.duration,
        percentage: progress.percentage,
        isCompleted: progress.isCompleted
      }
    });

  } catch (error) {
    console.error('Error saving progress:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving progress',
      error: error.message
    });
  }
};

// Get video progress for a course
const getProgress = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user._id;

    const progress = await Progress.findOne({ user: userId, course: courseId });

    if (!progress) {
      return res.json({
        success: true,
        progress: {
          currentTime: 0,
          duration: 0,
          percentage: 0,
          isCompleted: false
        }
      });
    }

    res.json({
      success: true,
      progress: {
        currentTime: progress.currentTime,
        duration: progress.duration,
        percentage: progress.percentage,
        isCompleted: progress.isCompleted,
        lastWatched: progress.lastWatched
      }
    });

  } catch (error) {
    console.error('Error getting progress:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting progress',
      error: error.message
    });
  }
};

// Get all user's course progress
const getUserProgress = async (req, res) => {
  try {
    const userId = req.user._id;

    const progressList = await Progress.find({ user: userId })
      .populate('course', 'title thumbnailUrl instructor')
      .sort({ lastWatched: -1 });

    res.json({
      success: true,
      progress: progressList
    });

  } catch (error) {
    console.error('Error getting user progress:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting user progress',
      error: error.message
    });
  }
};

module.exports = {
  saveProgress,
  getProgress,
  getUserProgress
};