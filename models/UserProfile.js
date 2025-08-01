const mongoose = require('mongoose');

const userProfileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    phone: {
        type: String,
        default: ''
    },
    location: {
        type: String,
        default: ''
    },
    bio: {
        type: String,
        default: ''
    },
    dateOfBirth: {
        type: Date,
        default: null
    },
    major: {
        type: String,
        default: 'Computer Science',
        enum: ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil', 'Electrical', 'Other']
    },
    profileImage: {
        type: String,
        default: null
    }
}, {
    timestamps: true  // This adds createdAt and updatedAt
});

module.exports = mongoose.model('UserProfile', userProfileSchema);