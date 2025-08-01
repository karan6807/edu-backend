const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    addedAt: { type: Date, default: Date.now }
});


// In cartModel.js, add this index after the schema definition
cartSchema.index({ user: 1, course: 1 }, { unique: true });

module.exports = mongoose.model("Cart", cartSchema);
