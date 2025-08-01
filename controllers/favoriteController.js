const Favorite = require("../models/favoriteModel");

const addToFavorites = async (req, res) => {
    try {
        const { courseId } = req.body;
        const userId = req.user._id;

        if (!courseId) {
            return res.status(400).json({ message: "Course ID is required" });
        }

        const existing = await Favorite.findOne({ user: userId, course: courseId });
        if (existing) {
            return res.status(409).json({ message: "Course already in favorites" });
        }

        const newFavorite = new Favorite({
            user: userId,
            course: courseId,
        });

        await newFavorite.save();
        res.status(201).json({ message: "Course added to favorites" });

    } catch (error) {
        console.error("Error adding to favorites:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

const getFavorites = async (req, res) => {
    try {
        const userId = req.user._id;

        console.log("Fetching favorites for user:", userId);

        // Find all favorite items for the user and populate course details
        const favoriteItems = await Favorite.find({ user: userId }).populate('course');

        console.log("Favorite items found:", favoriteItems.length);

        // Transform the data to match the frontend expectation
        const transformedItems = favoriteItems.map(item => ({
            course: item.course,
            addedAt: item.addedAt
        }));

        res.json({ items: transformedItems });

    } catch (error) {
        console.error("Error fetching favorites:", error);
        res.status(500).json({ message: "Server error while fetching favorites" });
    }
};

const removeFromFavorites = async (req, res) => {
    try {
        const { courseId } = req.params;
        const userId = req.user._id;

        console.log("Removing course from favorites:", { courseId, userId });

        const result = await Favorite.findOneAndDelete({
            user: userId,
            course: courseId
        });

        if (!result) {
            return res.status(404).json({ message: "Course not found in favorites" });
        }

        console.log("Course removed from favorites successfully");
        res.json({ message: "Course removed from favorites" });

    } catch (error) {
        console.error("Error removing from favorites:", error);
        res.status(500).json({ message: "Server error while removing from favorites" });
    }
};

const clearFavorites = async (req, res) => {
    try {
        const userId = req.user._id;

        console.log("Clearing favorites for user:", userId);

        await Favorite.deleteMany({ user: userId });

        console.log("Favorites cleared successfully");
        res.json({ message: "Favorites cleared" });

    } catch (error) {
        console.error("Error clearing favorites:", error);
        res.status(500).json({ message: "Server error while clearing favorites" });
    }
};

// Check if course is in user's favorites
const checkFavoriteStatus = async (req, res) => {
    try {
        const { courseId } = req.params;
        const userId = req.user._id;

        const favorite = await Favorite.findOne({ user: userId, course: courseId });
        
        res.json({ isFavorite: !!favorite });

    } catch (error) {
        console.error("Error checking favorite status:", error);
        res.status(500).json({ message: "Server error while checking favorite status" });
    }
};

module.exports = {
    addToFavorites,
    getFavorites,
    removeFromFavorites,
    clearFavorites,
    checkFavoriteStatus
};