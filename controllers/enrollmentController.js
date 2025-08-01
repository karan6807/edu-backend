const Enrollment = require("../models/Enrollment");

exports.enrollInCourse = async (req, res) => {
    const { courseId } = req.body;
    const userId = req.user.userId; // ✅ FIXED - Use userId instead of id

    try {
        // Check if already enrolled
        const alreadyEnrolled = await Enrollment.findOne({ user: userId, course: courseId });
        if (alreadyEnrolled) {
            return res.status(400).json({ message: "Already enrolled in this course" });
        }

        const enrollment = new Enrollment({
            user: userId,
            course: courseId,
        });

        await enrollment.save();

        res.status(201).json({ message: "Enrolled successfully" });
    } catch (error) {
        console.error("Enrollment error:", error.message);
        res.status(500).json({ message: "Server error" });
    }
};