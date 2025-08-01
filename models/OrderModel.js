const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    orderNumber: {
        type: String,
        required: true,
        unique: true  // This automatically creates an index
    },
    items: [{
        course: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Course",
            required: true
        },
        price: {
            type: Number,
            required: true
        },
        quantity: {
            type: Number,
            default: 1
        }
    }],

    // Customer Information
    customerInfo: {
        email: { type: String, required: true },
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        phone: { type: String, required: true },
        address: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        pincode: { type: String, required: true }
    },

    // Payment Information
    payment: {
        method: {
            type: String,
            enum: ['card', 'upi', 'netbanking', 'wallet'],
            required: true
        },
        status: {
            type: String,
            enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
            default: 'pending'
        },
        transactionId: String,
        stripePaymentIntentId: String,
        stripeSessionId: String,          // 🆕 NEW: For Stripe Checkout sessions
        razorpayOrderId: String,         // If using Razorpay for Indian payments
        razorpayPaymentId: String,
        paidAt: Date,
        failureReason: String
    },

    // Order Summary
    pricing: {
        subtotal: { type: Number, required: true },
        shipping: { type: Number, default: 0 },
        tax: { type: Number, required: true },
        total: { type: Number, required: true }
    },

    // Order Status
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'processing', 'completed', 'cancelled', 'refunded'],
        default: 'pending'
    },

    // Timestamps
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    completedAt: Date,
    cancelledAt: Date,

    // Additional fields
    notes: String,
    adminNotes: String
});

// Generate order number before saving
orderSchema.pre('save', async function (next) {
    if (this.isNew) {
        const count = await mongoose.model('Order').countDocuments();
        this.orderNumber = `ORD${Date.now()}${String(count + 1).padStart(4, '0')}`;
    }
    this.updatedAt = Date.now();
    next();
});

// Indexes for better performance
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ 'payment.status': 1 });
orderSchema.index({ 'payment.stripeSessionId': 1 });     // 🆕 NEW: Index for checkout sessions
orderSchema.index({ 'payment.stripePaymentIntentId': 1 });
orderSchema.index({ status: 1 });

module.exports = mongoose.model('Order', orderSchema);