// models/Category.js
const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Category name is required'],
        trim: true,
        maxlength: [100, 'Category name cannot exceed 100 characters']
    },

    slug: {
        type: String,
        trim: true,
        lowercase: true
    },

    level: {
        type: Number,
        required: [true, 'Category level is required'],
        min: [1, 'Level must be at least 1'],
        max: [3, 'Level cannot exceed 3'],
        default: 1
    },

    parentCategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        default: null
    },

    isActive: {
        type: Boolean,
        default: true
    },

    order: {
        type: Number,
        default: 0
    },

    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Description cannot exceed 500 characters']
    }

}, {
    timestamps: true
});

// Indexes for better performance
categorySchema.index({ level: 1, parentCategory: 1 });
categorySchema.index({ slug: 1 }, { unique: true, sparse: true });
categorySchema.index({ name: 1, level: 1, parentCategory: 1 });

// Pre-save middleware to generate slug
categorySchema.pre('save', function (next) {
    if (this.isModified('name') && !this.slug) {
        this.slug = this.name
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '');
    }
    next();
});

// Virtual for getting full category path
categorySchema.virtual('fullPath').get(function () {
    // This would need to be populated in the controller
    return this.name;
});

// Method to check if category has children
categorySchema.methods.hasChildren = async function () {
    const children = await this.constructor.find({ parentCategory: this._id });
    return children.length > 0;
};

// Static method to get category tree
categorySchema.statics.getTree = async function () {
    const categories = await this.find({ isActive: true })
        .populate('parentCategory', 'name level')
        .sort({ level: 1, order: 1, name: 1 });

    return categories;
};

module.exports = mongoose.model('Category', categorySchema);