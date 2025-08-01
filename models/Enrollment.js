const mongoose = require("mongoose");

const enrollmentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
        required: true,
    },
    enrolledAt: {
        type: Date,
        default: Date.now,
    },
    paymentStatus: {
        type: String,
        enum: ["pending", "completed"],
        default: "pending",
    }
});

module.exports = mongoose.model("Enrollment", enrollmentSchema);
