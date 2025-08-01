const express = require("express");
const router = express.Router();
const {
    createOrder,
    createCheckoutSession,      // 🆕 NEW: Stripe hosted checkout
    handleCheckoutSuccess,      // 🆕 NEW: Handle success
    createPaymentIntent,        // Keep for compatibility
    handlePaymentSuccess,       // Keep for compatibility
    clearCart,
    getUserOrders,
    getOrder,
    cancelOrder,
    getAllOrders,               // 🆕 ADD: Admin function to get all orders
    updateOrderStatus,          // 🆕 ADD: Admin function to update order status
    getOrderForAdmin,           // 🆕 ADD: Admin function to get order details
    getOrderAnalytics          // 🆕 ADD: Admin analytics function
} = require("../controllers/orderController");

// Import both middleware 🔥 CRITICAL FIX
const authenticate = require("../middleware/authMiddleware");
const adminAuthenticate = require("../middleware/adminMiddleware");

// ======================
// ADMIN ORDER ROUTES (Admin Authentication) 🔥 MUST COME FIRST
// ======================

// @route   GET /api/orders/admin/analytics
// @desc    Get order analytics (Admin only)
// @access  Private (Admin)
router.get("/admin/analytics", adminAuthenticate, getOrderAnalytics);

// @route   GET /api/orders/admin
// @desc    Get all orders (Admin only)
// @access  Private (Admin) 🔥 FIXED: Using adminAuthenticate
router.get("/admin", adminAuthenticate, getAllOrders);

// @route   PUT /api/orders/admin/:orderId/status
// @desc    Update order status (Admin only)
// @access  Private (Admin) 🔥 FIXED: Using adminAuthenticate
router.put("/admin/:orderId/status", adminAuthenticate, updateOrderStatus);

// @route   GET /api/orders/admin/:orderId
// @desc    Get order details for admin
// @access  Private (Admin) 🔥 FIXED: Using adminAuthenticate
router.get("/admin/:orderId", adminAuthenticate, getOrderForAdmin);

// ======================
// STRIPE CHECKOUT ROUTES (Must come before general routes)
// ======================

// 🆕 NEW: Stripe Checkout Routes
// @route   POST /api/orders/create-checkout-session
// @desc    Create Stripe checkout session (MAIN METHOD)
// @access  Private (User)
router.post("/create-checkout-session", authenticate, createCheckoutSession);

// @route   GET /api/orders/checkout-success
// @desc    Handle successful checkout return
// @access  Private (User)
// 🔥 FIX: This route was missing the proper path
router.get("/checkout-success", authenticate, handleCheckoutSuccess);

// ======================
// USER ORDER ROUTES (Regular Authentication)
// ======================

// @route   POST /api/orders/create
// @desc    Create a new order
// @access  Private (User)
router.post("/create", authenticate, createOrder);

// @route   POST /api/orders
// @desc    Create a new order (alternative endpoint)
// @access  Private (User)
router.post("/", authenticate, createOrder);

// Legacy Payment Intent Routes (Keep for compatibility)
// @route   POST /api/orders/create-payment-intent
// @desc    Create Stripe payment intent
// @access  Private (User)
router.post("/create-payment-intent", authenticate, createPaymentIntent);

// @route   POST /api/orders/payment-intent
// @desc    Create Stripe payment intent (frontend compatibility)
// @access  Private (User)
router.post("/payment-intent", authenticate, createPaymentIntent);

// @route   POST /api/orders/payment-success
// @desc    Handle successful payment
// @access  Private (User)
router.post("/payment-success", authenticate, handlePaymentSuccess);

// Cart & Order Management Routes (User)
// @route   DELETE /api/orders/clear-cart
// @desc    Clear user's cart
// @access  Private (User)
router.delete("/clear-cart", authenticate, clearCart);

// 🔥 FIX: Add the missing user-orders route that your frontend is calling
// @route   GET /api/orders/user-orders
// @desc    Get user's orders (Frontend expects this exact endpoint)
// @access  Private (User)
router.get("/user-orders", authenticate, getUserOrders);

// @route   GET /api/orders/my-orders
// @desc    Get user's orders (alternative endpoint)
// @access  Private (User)
router.get("/my-orders", authenticate, getUserOrders);

// @route   PUT /api/orders/:orderId/cancel
// @desc    Cancel order (Put this before the general :orderId route)
// @access  Private (User)
router.put("/:orderId/cancel", authenticate, cancelOrder);

// @route   GET /api/orders/:orderId
// @desc    Get single order (must be after admin routes and specific routes)
// @access  Private (User)
router.get("/:orderId", authenticate, getOrder);

// @route   GET /api/orders (alternative for user orders - keep for compatibility)
// @desc    Get user's orders (keep for compatibility)
// @access  Private (User)
// 🔥 NOTE: This should be last as it's a catch-all route
router.get("/", authenticate, getUserOrders);

module.exports = router;