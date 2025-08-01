const mongoose = require("mongoose");

const favoriteSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    addedAt: { type: Date, default: Date.now }
});

// Add unique index to prevent duplicate favorites
favoriteSchema.index({ user: 1, course: 1 }, { unique: true });

module.exports = mongoose.model("Favorite", favoriteSchema);