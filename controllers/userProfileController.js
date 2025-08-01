const User = require("../models/User");
const UserProfile = require("../models/UserProfile");

// Get complete user profile (User + UserProfile data)
exports.getUserProfile = async (req, res) => {
    try {
        // Get basic user data
        const user = await User.findById(req.user._id).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Get or create profile data
        let userProfile = await UserProfile.findOne({ userId: req.user._id });
        
        // If no profile exists, create one with default values
        if (!userProfile) {
            try {
                userProfile = new UserProfile({
                    userId: req.user._id,
                    phone: '',
                    location: '',
                    bio: '',
                    dateOfBirth: null,
                    major: 'Computer Science',
                    profileImage: null
                });
                await userProfile.save();
            } catch (createError) {
                console.error('Error creating profile:', createError);
                // If creation fails, return user data with default profile values
                const defaultProfile = {
                    _id: user._id,
                    username: user.username,
                    email: user.email,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt,
                    phone: '',
                    location: '',
                    bio: '',
                    dateOfBirth: null,
                    major: 'Computer Science',
                    profileImage: null
                };
                return res.status(200).json({ 
                    message: "Profile data retrieved (with defaults)", 
                    user: defaultProfile 
                });
            }
        }

        // Combine user and profile data
        const completeProfile = {
            // Basic user data
            _id: user._id,
            username: user.username,
            email: user.email,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            
            // Profile data
            phone: userProfile.phone,
            location: userProfile.location,
            bio: userProfile.bio,
            dateOfBirth: userProfile.dateOfBirth,
            major: userProfile.major,
            profileImage: userProfile.profileImage
        };

        res.status(200).json({ 
            message: "Profile data retrieved successfully", 
            user: completeProfile 
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ message: "Server error" });
    }
};

// Update user profile
exports.updateUserProfile = async (req, res) => {
    try {
        const userId = req.user._id;
        const { 
            username, 
            phone, 
            location, 
            bio, 
            dateOfBirth, 
            major, 
            profileImage 
        } = req.body;

        // Update basic user data (username)
        if (username) {
            await User.findByIdAndUpdate(userId, { username }, { new: true });
        }

        // Update or create profile data
        let userProfile = await UserProfile.findOne({ userId });
        
        if (!userProfile) {
            // Create new profile with better error handling
            try {
                userProfile = new UserProfile({
                    userId,
                    phone: phone || '',
                    location: location || '',
                    bio: bio || '',
                    dateOfBirth: dateOfBirth || null,
                    major: major || 'Computer Science',
                    profileImage: profileImage || null
                });
                await userProfile.save();
            } catch (createError) {
                console.error('Error creating profile during update:', createError);
                return res.status(500).json({ message: "Error creating profile" });
            }
        } else {
            // Update existing profile
            userProfile.phone = phone !== undefined ? phone : userProfile.phone;
            userProfile.location = location !== undefined ? location : userProfile.location;
            userProfile.bio = bio !== undefined ? bio : userProfile.bio;
            userProfile.dateOfBirth = dateOfBirth !== undefined ? dateOfBirth : userProfile.dateOfBirth;
            userProfile.major = major !== undefined ? major : userProfile.major;
            userProfile.profileImage = profileImage !== undefined ? profileImage : userProfile.profileImage;
            
            await userProfile.save();
        }

        // Get updated user data
        const updatedUser = await User.findById(userId).select("-password");

        // Combine updated data
        const completeProfile = {
            _id: updatedUser._id,
            username: updatedUser.username,
            email: updatedUser.email,
            createdAt: updatedUser.createdAt,
            updatedAt: updatedUser.updatedAt,
            
            phone: userProfile.phone,
            location: userProfile.location,
            bio: userProfile.bio,
            dateOfBirth: userProfile.dateOfBirth,
            major: userProfile.major,
            profileImage: userProfile.profileImage
        };

        res.status(200).json({ 
            message: "Profile updated successfully", 
            user: completeProfile 
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: "Server error" });
    }
};