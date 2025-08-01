const Cart = require("../models/cartModel");

const addToCart = async (req, res) => {
    try {
        const { courseId } = req.body;
        const userId = req.user._id;

        if (!courseId) {
            return res.status(400).json({ message: "Course ID is required" });
        }

        const existing = await Cart.findOne({ user: userId, course: courseId });
        if (existing) {
            return res.status(409).json({ message: "Course already in cart" });
        }

        const newCartItem = new Cart({
            user: userId,
            course: courseId,
        });

        await newCartItem.save();
        res.status(201).json({ message: "Course added to cart" });

    } catch (error) {
        console.error("Error adding to cart:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

const getCart = async (req, res) => {
    try {
        const userId = req.user._id;

        console.log("Fetching cart for user:", userId);

        // Find all cart items for the user and populate course details
        const cartItems = await Cart.find({ user: userId }).populate('course');

        console.log("Cart items found:", cartItems.length);

        // Transform the data to match the frontend expectation
        const transformedItems = cartItems.map(item => ({
            course: item.course,
            addedAt: item.addedAt
        }));

        res.json({ items: transformedItems });

    } catch (error) {
        console.error("Error fetching cart:", error);
        res.status(500).json({ message: "Server error while fetching cart" });
    }
};

const removeFromCart = async (req, res) => {
    try {
        const { courseId } = req.params;
        const userId = req.user._id;

        console.log("Removing course from cart:", { courseId, userId });

        const result = await Cart.findOneAndDelete({
            user: userId,
            course: courseId
        });

        if (!result) {
            return res.status(404).json({ message: "Course not found in cart" });
        }

        console.log("Course removed from cart successfully");
        res.json({ message: "Course removed from cart" });

    } catch (error) {
        console.error("Error removing from cart:", error);
        res.status(500).json({ message: "Server error while removing from cart" });
    }
};

const clearCart = async (req, res) => {
    try {
        const userId = req.user._id;

        console.log("Clearing cart for user:", userId);

        await Cart.deleteMany({ user: userId });

        console.log("Cart cleared successfully");
        res.json({ message: "Cart cleared" });

    } catch (error) {
        console.error("Error clearing cart:", error);
        res.status(500).json({ message: "Server error while clearing cart" });
    }
};

module.exports = {
    addToCart,
    getCart,
    removeFromCart,
    clearCart
};