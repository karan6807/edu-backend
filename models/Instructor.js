const mongoose = require('mongoose');

const instructorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Instructor name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  bio: {
    type: String,
    trim: true,
    maxlength: [1000, 'Bio cannot exceed 1000 characters']
  },
  specializations: [{
    type: String,
    trim: true
  }],
  experience: {
    type: Number,
    default: 0,
    min: [0, 'Experience cannot be negative'],
    max: [50, 'Experience cannot exceed 50 years']
  },
  profileImage: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        if (!v) return true; // Allow empty string
        // Accept both full URLs and relative paths
        const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
        const pathRegex = /^\/[\w\/-]+\.(jpg|jpeg|png|gif|webp)$/i;
        return urlRegex.test(v) || pathRegex.test(v);
      },
      message: 'Please enter a valid URL or path for profile image'
    }
  },
  dateJoined: {
    type: Date,
    default: Date.now
  },
  rating: {
    type: Number,
    default: 0,
    min: [0, 'Rating cannot be negative'],
    max: [5, 'Rating cannot exceed 5']
  },
  totalStudents: {
    type: Number,
    default: 0,
    min: [0, 'Total students cannot be negative']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  courses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],
  socialLinks: {
    linkedin: {
      type: String,
      trim: true
    },
    github: {
      type: String,
      trim: true
    },
    website: {
      type: String,
      trim: true
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name initials
instructorSchema.virtual('initials').get(function() {
  return this.name
    .split(' ')
    .map(name => name[0])
    .join('')
    .toUpperCase();
});

// Virtual for experience display
instructorSchema.virtual('experienceDisplay').get(function() {
  if (this.experience === 0) return 'New Instructor';
  if (this.experience === 1) return '1 year';
  return `${this.experience} years`;
});

// Index for better query performance
instructorSchema.index({ name: 1 });
instructorSchema.index({ email: 1 });
instructorSchema.index({ specializations: 1 });
instructorSchema.index({ rating: -1 });
instructorSchema.index({ isActive: 1 });

// Pre-save middleware to clean up data
instructorSchema.pre('save', function(next) {
  // Remove empty specializations
  if (this.specializations && this.specializations.length > 0) {
    this.specializations = this.specializations.filter(spec => spec.trim() !== '');
  }
  
  // Ensure experience is a number
  if (this.experience && typeof this.experience === 'string') {
    this.experience = parseInt(this.experience) || 0;
  }
  
  next();
});

// Instance method to get instructor stats
instructorSchema.methods.getStats = function() {
  return {
    totalCourses: this.courses.length,
    totalStudents: this.totalStudents,
    rating: this.rating,
    experience: this.experience,
    specializations: this.specializations.length
  };
};

// Static method to find by specialization
instructorSchema.statics.findBySpecialization = function(specialization) {
  return this.find({
    specializations: { $in: [new RegExp(specialization, 'i')] },
    isActive: true
  });
};

// Static method to get top-rated instructors
instructorSchema.statics.getTopRated = function(limit = 10) {
  return this.find({ isActive: true })
    .sort({ rating: -1, totalStudents: -1 })
    .limit(limit);
};

module.exports = mongoose.model('Instructor', instructorSchema);