const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    instructor: { type: String, required: true, default: 'You' },
    price: { type: Number, required: true, default: 0 },
    category: { type: String, required: true },
    subcategory: { type: String, default: '' },
    sub_subcategory: { type: String, default: '' },
    level: {
        type: String,
        enum: ['Beginner', 'Intermediate', 'Advanced', 'Professional'], // Added Professional
        required: true
    },
    duration: { type: String, required: true },
    thumbnailUrl: { type: String, default: '' },
    videoUrl: { type: String, default: '' },
    tags: { type: [String], default: [] },
    language: { type: String, required: true },
    isPublished: { type: Boolean, required: true, default: false },
    // ✅ NEW FIELDS ADDED
    learningOutcomes: {
        type: [String],
        default: [],
        validate: {
            validator: function (v) {
                // Filter out empty strings and validate
                return v.every(outcome => typeof outcome === 'string');
            },
            message: 'Learning outcomes must be an array of strings'
        }
    },
    whatYouWillLearn: {
        type: [String],
        default: [],
        validate: {
            validator: function (v) {
                // Filter out empty strings and validate
                return v.every(item => typeof item === 'string');
            },
            message: 'What you will learn must be an array of strings'
        }
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

// Update the updatedAt field before saving
courseSchema.pre('save', function (next) {
    this.updatedAt = Date.now();

    // Clean up empty strings from arrays before saving
    if (this.learningOutcomes) {
        this.learningOutcomes = this.learningOutcomes.filter(outcome => outcome && outcome.trim() !== '');
    }

    if (this.whatYouWillLearn) {
        this.whatYouWillLearn = this.whatYouWillLearn.filter(item => item && item.trim() !== '');
    }

    if (this.tags) {
        this.tags = this.tags.filter(tag => tag && tag.trim() !== '');
    }

    next();
});

module.exports = mongoose.model('Course', courseSchema);