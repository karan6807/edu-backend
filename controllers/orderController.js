
const Order = require("../models/OrderModel");
const Cart = require("../models/cartModel");
const Course = require("../models/Course");
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { sendPurchaseConfirmationEmail, sendWelcomeEmail } = require('../utils/emailService');


// Generate unique order number
const generateOrderNumber = () => {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `ORD-${timestamp}-${random}`;
};

// Create a new order
const createOrder = async (req, res) => {
    try {
        const userId = req.user._id;
        const { shippingAddress, customerInfo, paymentMethod, items } = req.body;

        // Use shippingAddress if provided (from frontend), otherwise use customerInfo
        const orderCustomerInfo = shippingAddress || customerInfo;

        // Validate required fields
        const requiredFields = ['email', 'firstName', 'lastName', 'phone', 'address', 'city', 'state', 'pincode'];
        for (const field of requiredFields) {
            if (!orderCustomerInfo[field]) {
                return res.status(400).json({
                    message: `${field} is required`,
                    field: field
                });
            }
        }

        let orderItems = [];
        let subtotal = 0;

        // 🔥 NEW: Handle direct purchase (Buy Now) vs cart-based purchase
        if (items && items.length > 0) {
            // Direct purchase: items provided in request
            console.log("Processing direct purchase with items:", items);

            // Validate and process each item
            for (const item of items) {
                const course = await Course.findById(item.courseId);
                if (!course) {
                    return res.status(400).json({
                        message: `Course not found: ${item.courseId}`
                    });
                }

                // Use the price from the request or fallback to course price
                const itemPrice = item.price || course.discountedPrice || course.price;
                const quantity = item.quantity || 1;

                orderItems.push({
                    course: course._id,
                    price: itemPrice,
                    quantity: quantity
                });

                subtotal += itemPrice * quantity;
            }
        } else {
            // Cart-based purchase: get items from user's cart
            console.log("Processing cart-based purchase");

            const cartItems = await Cart.find({ user: userId }).populate('course');

            if (!cartItems || cartItems.length === 0) {
                return res.status(400).json({ message: "Cart is empty" });
            }

            // Process cart items
            orderItems = cartItems.map(item => ({
                course: item.course._id,
                price: item.course.discountedPrice || item.course.price,
                quantity: item.quantity || 1
            }));

            subtotal = cartItems.reduce((sum, item) => {
                const price = item.course.discountedPrice || item.course.price;
                return sum + (price * (item.quantity || 1));
            }, 0);
        }

        // Validate that we have items to process
        if (orderItems.length === 0) {
            return res.status(400).json({ message: "No items to process" });
        }

        // Calculate pricing
        const shipping = subtotal > 50000 ? 0 : 500; // Free shipping above ₹50,000
        const tax = Math.round(subtotal * 0.18); // 18% GST
        const total = subtotal + shipping + tax;

        const orderNumber = generateOrderNumber();

        // Create the order
        const newOrder = new Order({
            orderNumber: orderNumber,
            user: userId,
            items: orderItems,
            customerInfo: orderCustomerInfo,
            payment: {
                method: paymentMethod,
                status: 'pending'
            },
            pricing: {
                subtotal: subtotal,
                shipping: shipping,
                tax: tax,
                total: total
            },
            status: 'pending'
        });

        await newOrder.save();
        await newOrder.populate('items.course');

        console.log("Order created successfully:", {
            orderNumber: newOrder.orderNumber,
            itemCount: orderItems.length,
            total: total,
            isDirectPurchase: !!(items && items.length > 0)
        });

        res.status(201).json({
            message: "Order created successfully",
            order: newOrder
        });

    } catch (error) {
        console.error("Error creating order:", error);
        res.status(500).json({ message: "Server error while creating order" });
    }
};

// 🔥 UPDATED: Create Stripe Checkout Session - Now redirects to my-courses page
const createCheckoutSession = async (req, res) => {
    try {
        const { orderId, userId } = req.body;

        console.log('🔥 CREATE CHECKOUT SESSION - Request:', { orderId, userId });

        // Find the order and populate course details
        const order = await Order.findById(orderId).populate('items.course');
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        console.log('📦 Order found for checkout:', {
            orderId: order._id,
            orderNumber: order.orderNumber,
            total: order.pricing.total,
            paymentStatus: order.payment.status
        });

        // Create line items using course data
        const lineItems = order.items.map(item => {
            // Validate and fix thumbnail URL
            let imageUrl = null;
            if (item.course?.thumbnailUrl) {
                const url = item.course.thumbnailUrl.trim();
                // Only include if it's a valid HTTP/HTTPS URL
                if (url.startsWith('http://') || url.startsWith('https://')) {
                    imageUrl = url;
                }
            }

            return {
                price_data: {
                    currency: 'inr',
                    product_data: {
                        name: item.course?.title || `Course ${item.course?._id}`,
                        description: item.course?.description?.substring(0, 500) || 'Online Course',
                        images: imageUrl ? [imageUrl] : [],
                    },
                    unit_amount: Math.round(item.price * 100), // Convert to paise
                },
                quantity: item.quantity || 1,
            };
        });

        // Add shipping using correct field names
        if (order.pricing.shipping && order.pricing.shipping > 0) {
            lineItems.push({
                price_data: {
                    currency: 'inr',
                    product_data: {
                        name: 'Shipping',
                        description: 'Delivery charges',
                    },
                    unit_amount: Math.round(order.pricing.shipping * 100),
                },
                quantity: 1,
            });
        }

        // Add tax using correct field names
        if (order.pricing.tax && order.pricing.tax > 0) {
            lineItems.push({
                price_data: {
                    currency: 'inr',
                    product_data: {
                        name: 'Tax (GST)',
                        description: 'Tax charges',
                    },
                    unit_amount: Math.round(order.pricing.tax * 100),
                },
                quantity: 1,
            });
        }

        // 🔥 UPDATED: URLs now redirect to my-courses page
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const successUrl = `${frontendUrl}/my-courses?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}&payment_success=true`;
        const cancelUrl = `${frontendUrl}/my-courses?canceled=true&order_id=${orderId}`;

        console.log('🔗 Checkout URLs (Updated to my-courses):', {
            successUrl,
            cancelUrl
        });

        // Create Stripe checkout session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: successUrl,
            cancel_url: cancelUrl,
            metadata: {
                orderId: orderId.toString(),
                userId: userId?.toString() || order.user.toString(),
                orderNumber: order.orderNumber || '',
            },
            customer_email: order.customerInfo?.email || undefined,
            expires_at: Math.floor(Date.now() / 1000) + (30 * 60), // 30 minutes
        });

        console.log('✅ Stripe session created with my-courses redirect:', {
            sessionId: session.id,
            url: session.url
        });

        // Update order with correct field name
        await Order.findByIdAndUpdate(orderId, {
            'payment.stripeSessionId': session.id,
            'payment.status': 'pending'
        });

        res.json({
            success: true,
            sessionId: session.id,
            url: session.url
        });

    } catch (error) {
        console.error('❌ Error creating checkout session:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating checkout session',
            error: error.message
        });
    }
};

// 🔥 UPDATED: Handle Stripe Checkout Success - Now works with my-courses page
// Update your handleCheckoutSuccess function - ADD EMAIL SENDING HERE
const handleCheckoutSuccess = async (req, res) => {
    try {
        const { session_id, order_id, payment_success } = req.query;

        console.log('🎯 CHECKOUT SUCCESS - Query params:', {
            session_id,
            order_id,
            payment_success
        });

        if (!session_id && !order_id) {
            return res.status(400).json({
                success: false,
                message: "Session ID or Order ID is required"
            });
        }

        // Find the order by stripeSessionId or orderId
        let order;
        if (session_id) {
            order = await Order.findOne({
                'payment.stripeSessionId': session_id
            });
        } else if (order_id) {
            order = await Order.findById(order_id);
        }

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        console.log('📦 Order found for checkout success:', {
            orderId: order._id,
            orderNumber: order.orderNumber,
            currentStatus: order.status,
            paymentStatus: order.payment.status
        });

        // Update order status if payment is successful and not already processed
        if (order.payment.status === 'pending' && payment_success === 'true') {
            order.payment.status = 'completed';
            order.payment.paidAt = new Date();
            order.status = 'confirmed';
            await order.save();

            // Clear user's cart after successful payment
            await Cart.deleteMany({ user: order.user });
            console.log('🛒 Cart cleared after successful payment');

            // 📧 SEND PURCHASE CONFIRMATION EMAIL
            try {
                const populatedOrderForEmail = await Order.findById(order._id)
                    .populate('items.course', 'title description price thumbnailUrl')
                    .populate('user', 'username email firstName lastName');

                console.log('📧 Sending purchase confirmation email...');
                const emailResult = await sendPurchaseConfirmationEmail(populatedOrderForEmail);

                if (emailResult.success) {
                    console.log('✅ Purchase confirmation email sent successfully!');
                } else {
                    console.error('❌ Failed to send purchase confirmation email:', emailResult.error);
                }

                // Optional: Send welcome email after a short delay
                setTimeout(async () => {
                    try {
                        const welcomeEmailResult = await sendWelcomeEmail(populatedOrderForEmail);
                        console.log('📧 Welcome email result:', welcomeEmailResult.success ? 'Sent' : 'Failed');
                    } catch (welcomeError) {
                        console.error('❌ Welcome email error:', welcomeError);
                    }
                }, 5000); // 5 seconds delay

            } catch (emailError) {
                console.error('❌ Email sending error:', emailError);
                // Don't fail the order process if email fails
            }
        }

        // Populate the order with all required data
        const populatedOrder = await Order.findById(order._id)
            .populate({
                path: 'items.course',
                select: 'title description price thumbnailUrl'
            })
            .populate({
                path: 'user',
                select: 'username email firstName lastName'
            });

        // Transform the response to match frontend expectations
        const orderResponse = {
            _id: populatedOrder._id,
            orderId: populatedOrder._id,
            orderNumber: populatedOrder.orderNumber,
            user: populatedOrder.user,
            items: populatedOrder.items,
            customerInfo: populatedOrder.customerInfo,
            payment: populatedOrder.payment,
            pricing: populatedOrder.pricing,
            status: populatedOrder.status,
            createdAt: populatedOrder.createdAt,
            updatedAt: populatedOrder.updatedAt,
            subtotal: populatedOrder.pricing.subtotal,
            tax: populatedOrder.pricing.tax,
            total: populatedOrder.pricing.total
        };

        console.log('✅ Returning order data for my-courses page');

        res.json({
            success: true,
            message: payment_success === 'true' ? "Payment successful! You can now access your courses." : "Payment status updated.",
            order: orderResponse,
            redirected_from_payment: true // Flag to help frontend identify this came from payment
        });

    } catch (error) {
        console.error('❌ Checkout success error:', error);
        res.status(500).json({
            success: false,
            message: "Error processing checkout success",
            error: error.message
        });
    }
};

// Create Stripe Payment Intent (Keep for compatibility)
const createPaymentIntent = async (req, res) => {
    try {
        const { orderId, paymentMethod } = req.body;
        const userId = req.user._id;

        console.log('🔍 CREATE PAYMENT INTENT - Request:', { orderId, paymentMethod, userId });

        // Find the order
        const order = await Order.findOne({ _id: orderId, user: userId });
        if (!order) {
            console.log('❌ Order not found:', { orderId, userId });
            return res.status(404).json({ message: "Order not found" });
        }

        console.log('📦 Order found:', {
            orderId: order._id,
            orderNumber: order.orderNumber,
            total: order.pricing.total,
            paymentStatus: order.payment.status
        });

        if (order.payment.status !== 'pending') {
            console.log('⚠️ Order payment already processed:', order.payment.status);
            return res.status(400).json({ message: "Order payment already processed" });
        }

        if (paymentMethod === 'card') {
            // Create Stripe PaymentIntent for card payments
            const paymentIntent = await stripe.paymentIntents.create({
                amount: Math.round(order.pricing.total * 100), // Convert to paise
                currency: 'inr',
                metadata: {
                    orderId: order._id.toString(),
                    userId: userId.toString(),
                    orderNumber: order.orderNumber
                }
            });

            console.log('💳 Stripe PaymentIntent created:', {
                id: paymentIntent.id,
                amount: paymentIntent.amount,
                status: paymentIntent.status,
                client_secret: paymentIntent.client_secret ? 'Present' : 'Missing'
            });

            // Update order with Stripe payment intent ID
            order.payment.stripePaymentIntentId = paymentIntent.id;
            order.payment.status = 'processing';
            await order.save();

            console.log('✅ Order updated with payment intent ID');

            res.json({
                clientSecret: paymentIntent.client_secret,
                paymentIntentId: paymentIntent.id,
                paymentIntent: paymentIntent
            });
        } else {
            // 🔥 UPDATED: For UPI/NetBanking, redirect to my-courses after payment
            const paymentUrl = `${process.env.FRONTEND_URL}/my-courses?order_id=${order._id}&method=${paymentMethod}&payment_redirect=true`;

            order.payment.status = 'processing';
            await order.save();

            console.log('🏦 Non-card payment method (redirects to my-courses):', { paymentMethod, paymentUrl });

            res.json({
                paymentUrl: paymentUrl,
                orderId: order._id,
                message: "Redirect to payment gateway"
            });
        }

    } catch (error) {
        console.error("❌ Error creating payment intent:", error);
        res.status(500).json({ message: "Error creating payment intent" });
    }
};

// Handle payment success (Keep for compatibility)
const handlePaymentSuccess = async (req, res) => {
    try {
        const { paymentIntentId, orderId } = req.body;
        const userId = req.user._id;

        console.log('🎯 HANDLE PAYMENT SUCCESS - Request:', {
            paymentIntentId,
            orderId,
            userId,
            body: req.body
        });

        // Find order by payment intent ID or order ID
        let order;
        if (paymentIntentId) {
            order = await Order.findOne({
                'payment.stripePaymentIntentId': paymentIntentId,
                user: userId
            });
            console.log('🔍 Looking for order by paymentIntentId:', paymentIntentId);
        } else if (orderId) {
            order = await Order.findOne({ _id: orderId, user: userId });
            console.log('🔍 Looking for order by orderId:', orderId);
        }

        if (!order) {
            console.log('❌ Order not found with criteria:', { paymentIntentId, orderId, userId });
            return res.status(404).json({ message: "Order not found" });
        }

        console.log('📦 Order found for payment success:', {
            orderId: order._id,
            orderNumber: order.orderNumber,
            currentPaymentStatus: order.payment.status,
            currentOrderStatus: order.status,
            stripePaymentIntentId: order.payment.stripePaymentIntentId
        });

        let shouldSendEmail = false;

        if (paymentIntentId) {
            console.log('💳 Verifying Stripe payment...');

            // Verify payment with Stripe
            const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

            console.log('📊 Stripe PaymentIntent Details:', {
                id: paymentIntent.id,
                status: paymentIntent.status,
                amount: paymentIntent.amount,
                amount_received: paymentIntent.amount_received,
                charges: paymentIntent.charges?.data?.length || 0,
                last_payment_error: paymentIntent.last_payment_error
            });

            // Check multiple success conditions
            const isPaymentSuccessful = paymentIntent.status === 'succeeded' ||
                paymentIntent.status === 'processing' ||
                (paymentIntent.charges && paymentIntent.charges.data.length > 0 &&
                    paymentIntent.charges.data[0].status === 'succeeded');

            console.log('🎯 Payment Success Check:', {
                paymentIntentStatus: paymentIntent.status,
                isPaymentSuccessful,
                chargesCount: paymentIntent.charges?.data?.length || 0,
                firstChargeStatus: paymentIntent.charges?.data?.[0]?.status
            });

            if (isPaymentSuccessful) {
                console.log('✅ Payment verified as successful, updating order...');

                // Update order status
                order.payment.status = 'completed';
                order.payment.transactionId = paymentIntent.id;
                order.payment.paidAt = new Date();
                order.status = 'confirmed';
                order.completedAt = new Date();

                await order.save();
                console.log('✅ Order updated successfully');

                shouldSendEmail = true;

                // Clear user's cart after successful payment
                const deletedCartItems = await Cart.deleteMany({ user: userId });
                console.log('🛒 Cart cleared:', deletedCartItems.deletedCount, 'items removed');

            } else {
                console.log('❌ Payment not successful:', {
                    status: paymentIntent.status,
                    lastError: paymentIntent.last_payment_error
                });

                order.payment.status = 'failed';
                order.payment.failureReason = `Payment status: ${paymentIntent.status}`;
                if (paymentIntent.last_payment_error) {
                    order.payment.failureReason += ` - ${paymentIntent.last_payment_error.message}`;
                }
                await order.save();

                return res.status(400).json({
                    message: "Payment not completed",
                    details: {
                        status: paymentIntent.status,
                        error: paymentIntent.last_payment_error?.message
                    }
                });
            }
        } else {
            console.log('🏦 Non-Stripe payment confirmation');

            // For non-Stripe payments (UPI/NetBanking), mark as completed
            order.payment.status = 'completed';
            order.payment.paidAt = new Date();
            order.status = 'confirmed';
            order.completedAt = new Date();

            await order.save();
            console.log('✅ Non-Stripe payment marked as completed');

            shouldSendEmail = true;

            // Clear user's cart after successful payment
            const deletedCartItems = await Cart.deleteMany({ user: userId });
            console.log('🛒 Cart cleared:', deletedCartItems.deletedCount, 'items removed');
        }

        // 📧 SEND PURCHASE CONFIRMATION EMAIL IF PAYMENT WAS SUCCESSFUL
        if (shouldSendEmail) {
            try {
                const populatedOrderForEmail = await Order.findById(order._id)
                    .populate('items.course', 'title description price thumbnailUrl')
                    .populate('user', 'username email firstName lastName');

                console.log('📧 Sending purchase confirmation email...');
                const emailResult = await sendPurchaseConfirmationEmail(populatedOrderForEmail);

                if (emailResult.success) {
                    console.log('✅ Purchase confirmation email sent successfully!');
                } else {
                    console.error('❌ Failed to send purchase confirmation email:', emailResult.error);
                }

                // Optional: Send welcome email after a short delay
                setTimeout(async () => {
                    try {
                        const welcomeEmailResult = await sendWelcomeEmail(populatedOrderForEmail);
                        console.log('📧 Welcome email result:', welcomeEmailResult.success ? 'Sent' : 'Failed');
                    } catch (welcomeError) {
                        console.error('❌ Welcome email error:', welcomeError);
                    }
                }, 5000); // 5 seconds delay

            } catch (emailError) {
                console.error('❌ Email sending error:', emailError);
                // Don't fail the order process if email fails
            }
        }

        res.json({
            message: "Payment successful! You can now access your courses.",
            order: order,
            redirect_to_courses: true // Flag for frontend to redirect to my-courses
        });

    } catch (error) {
        console.error("❌ Error handling payment success:", error);
        console.error("Stack trace:", error.stack);
        res.status(500).json({
            message: "Error processing payment",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Clear cart endpoint
const clearCart = async (req, res) => {
    try {
        const userId = req.user._id;
        const result = await Cart.deleteMany({ user: userId });

        console.log('🛒 Manual cart clear:', result.deletedCount, 'items removed');
        res.json({
            message: "Cart cleared successfully",
            deletedCount: result.deletedCount
        });
    } catch (error) {
        console.error("Error clearing cart:", error);
        res.status(500).json({ message: "Error clearing cart" });
    }
};

// Get user's orders
const getUserOrders = async (req, res) => {
    try {
        const userId = req.user._id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const orders = await Order.find({ user: userId })
            .populate('items.course', 'title thumbnailUrl instructor')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalOrders = await Order.countDocuments({ user: userId });

        res.json({
            orders,
            pagination: {
                current: page,
                pages: Math.ceil(totalOrders / limit),
                total: totalOrders
            }
        });

    } catch (error) {
        console.error("Error fetching user orders:", error);
        res.status(500).json({ message: "Error fetching orders" });
    }
};

// Get single order
const getOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.user._id;

        const order = await Order.findOne({ _id: orderId, user: userId })
            .populate('items.course')
            .populate('user', 'username email');

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        res.json({ order });

    } catch (error) {
        console.error("Error fetching order:", error);
        res.status(500).json({ message: "Error fetching order" });
    }
};

// Cancel order (only if payment is pending)
const cancelOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.user._id;

        const order = await Order.findOne({ _id: orderId, user: userId });

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        if (order.payment.status === 'completed') {
            return res.status(400).json({ message: "Cannot cancel paid order" });
        }

        order.status = 'cancelled';
        order.cancelledAt = new Date();
        await order.save();

        res.json({ message: "Order cancelled successfully" });

    } catch (error) {
        console.error("Error cancelling order:", error);
        res.status(500).json({ message: "Error cancelling order" });
    }
};

const getAllOrders = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Optional filters
        const { status, paymentStatus, search } = req.query;
        let filter = {};

        if (status && status !== 'all') {
            filter.status = status;
        }

        if (paymentStatus && paymentStatus !== 'all') {
            filter['payment.status'] = paymentStatus;
        }

        // Search by order number or customer email
        if (search) {
            filter.$or = [
                { orderNumber: { $regex: search, $options: 'i' } },
                { 'customerInfo.email': { $regex: search, $options: 'i' } },
                { 'customerInfo.firstName': { $regex: search, $options: 'i' } },
                { 'customerInfo.lastName': { $regex: search, $options: 'i' } }
            ];
        }

        const orders = await Order.find(filter)
            .populate('items.course', 'title thumbnailUrl price')
            .populate('user', 'username email firstName lastName')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalOrders = await Order.countDocuments(filter);

        // Calculate summary statistics
        const totalRevenue = await Order.aggregate([
            { $match: { 'payment.status': 'completed' } },
            { $group: { _id: null, total: { $sum: '$pricing.total' } } }
        ]);

        const orderStats = await Order.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        res.json({
            success: true,
            orders,
            pagination: {
                current: page,
                pages: Math.ceil(totalOrders / limit),
                total: totalOrders,
                hasNext: page < Math.ceil(totalOrders / limit),
                hasPrev: page > 1
            },
            summary: {
                totalRevenue: totalRevenue[0]?.total || 0,
                orderStats: orderStats.reduce((acc, stat) => {
                    acc[stat._id] = stat.count;
                    return acc;
                }, {})
            }
        });

    } catch (error) {
        console.error("Error fetching all orders:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching orders",
            error: error.message
        });
    }
};

// Update order status (admin only)
const updateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status, notes } = req.body;

        const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status"
            });
        }

        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        // Update order status
        order.status = status;

        // Add status change to history
        if (!order.statusHistory) {
            order.statusHistory = [];
        }

        order.statusHistory.push({
            status: status,
            notes: notes || '',
            changedBy: req.user._id,
            changedAt: new Date()
        });

        // Set completion date if delivered
        if (status === 'delivered') {
            order.deliveredAt = new Date();
        }

        // Set cancellation date if cancelled
        if (status === 'cancelled') {
            order.cancelledAt = new Date();
        }

        await order.save();

        // Populate and return updated order
        const updatedOrder = await Order.findById(orderId)
            .populate('items.course', 'title thumbnailUrl price')
            .populate('user', 'username email firstName lastName');

        res.json({
            success: true,
            message: "Order status updated successfully",
            order: updatedOrder
        });

    } catch (error) {
        console.error("Error updating order status:", error);
        res.status(500).json({
            success: false,
            message: "Error updating order status",
            error: error.message
        });
    }
};

// Get single order for admin (more detailed than user version)
const getOrderForAdmin = async (req, res) => {
    try {
        const { orderId } = req.params;

        const order = await Order.findById(orderId)
            .populate('items.course')
            .populate('user', 'username email firstName lastName phone')
            .populate('statusHistory.changedBy', 'username email');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        res.json({
            success: true,
            order
        });

    } catch (error) {
        console.error("Error fetching order for admin:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching order",
            error: error.message
        });
    }
};

// Get order analytics (admin only)
const getOrderAnalytics = async (req, res) => {
    try {
        const { period = '30d' } = req.query;

        let dateFilter = {};
        const now = new Date();

        switch (period) {
            case '7d':
                dateFilter = { createdAt: { $gte: new Date(now - 7 * 24 * 60 * 60 * 1000) } };
                break;
            case '30d':
                dateFilter = { createdAt: { $gte: new Date(now - 30 * 24 * 60 * 60 * 1000) } };
                break;
            case '90d':
                dateFilter = { createdAt: { $gte: new Date(now - 90 * 24 * 60 * 60 * 1000) } };
                break;
            case '1y':
                dateFilter = { createdAt: { $gte: new Date(now - 365 * 24 * 60 * 60 * 1000) } };
                break;
        }

        // Revenue analytics
        const revenueData = await Order.aggregate([
            { $match: { ...dateFilter, 'payment.status': 'completed' } },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' },
                        day: { $dayOfMonth: '$createdAt' }
                    },
                    revenue: { $sum: '$pricing.total' },
                    orders: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
        ]);
        // Top selling courses
        const topCourses = await Order.aggregate([
            { $match: { ...dateFilter, 'payment.status': 'completed' } },
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.course',
                    totalSold: { $sum: '$items.quantity' },
                    revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
                }
            },
            { $sort: { totalSold: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'courses',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'course'
                }
            },
            { $unwind: '$course' }
        ]);

        res.json({
            success: true,
            analytics: {
                revenueData,
                topCourses,
                period
            }
        });

    } catch (error) {
        console.error("Error fetching order analytics:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching analytics",
            error: error.message
        });
    }
};

module.exports = {
    createOrder,
    createCheckoutSession,      // 🆕 NEW: Main method for hosted checkout
    handleCheckoutSuccess,      // 🆕 NEW: Handle success after checkout
    createPaymentIntent,        // Keep for compatibility
    handlePaymentSuccess,       // Keep for compatibility
    clearCart,
    getUserOrders,
    getOrder,
    cancelOrder,
    getAllOrders,
    updateOrderStatus,
    getOrderForAdmin,
    getOrderAnalytics
};