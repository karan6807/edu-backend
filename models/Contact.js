const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Name is required"],
        trim: true,
        maxlength: [100, "Name cannot exceed 100 characters"]
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"]
    },
    phone: {
        type: String,
        trim: true,
        match: [/^[\+]?[1-9][\d]{0,15}$/, "Please provide a valid phone number"]
    },
    subject: {
        type: String,
        required: [true, "Subject is required"],
        trim: true,
        maxlength: [200, "Subject cannot exceed 200 characters"]
    },
    message: {
        type: String,
        required: [true, "Message is required"],
        trim: true,
        maxlength: [1000, "Message cannot exceed 1000 characters"]
    },
    userType: {
        type: String,
        required: [true, "User type is required"],
        enum: {
            values: ["student", "parent", "teacher", "other"],
            message: "User type must be one of: student, parent, teacher, other"
        },
        default: "student"
    },
    status: {
        type: String,
        enum: ["unread", "read", "pending", "replied", "resolved"], // ✅ ADDED "pending"
        default: "unread"
    },
    priority: {
        type: String,
        enum: ["low", "medium", "high", "urgent"],
        default: "medium"
    },
    adminNotes: {
        type: String,
        trim: true
    },
    repliedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin"
    },
    repliedAt: {
        type: Date
    },
    // Use submittedAt as the main timestamp field
    submittedAt: {
        type: Date,
        default: Date.now,
        immutable: true
    }
}, {
    timestamps: true
});

// Index for better query performance
contactSchema.index({ email: 1 });
contactSchema.index({ status: 1 });
contactSchema.index({ submittedAt: -1 });
contactSchema.index({ userType: 1 });

// Virtual for full contact info
contactSchema.virtual('contactInfo').get(function () {
    return `${this.name} (${this.email})${this.phone ? ` - ${this.phone}` : ''}`;
});

// Method to mark as read
contactSchema.methods.markAsRead = function () {
    this.status = 'read';
    return this.save();
};

// Method to reply to contact
contactSchema.methods.replyToContact = function (adminId) {
    this.status = 'replied';
    this.repliedBy = adminId;
    this.repliedAt = new Date();
    return this.save();
};

// Static method to get contact statistics
contactSchema.statics.getContactStats = async function () {
    const stats = await this.aggregate([
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 }
            }
        }
    ]);

    const userTypeStats = await this.aggregate([
        {
            $group: {
                _id: '$userType',
                count: { $sum: 1 }
            }
        }
    ]);

    return {
        statusStats: stats,
        userTypeStats: userTypeStats,
        total: await this.countDocuments()
    };
};

module.exports = mongoose.model("Contact", contactSchema);