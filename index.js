// Updated index.js file with userProfile routes added

const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");

dotenv.config();
const app = express();

// ✅ Middleware
app.use(cors({
    origin: [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002"
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ✅ Routes
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const contactRoutes = require("./routes/contactRoutes");
const publicRoutes = require("./routes/publicRoutes");
const favoriteRoutes = require('./routes/favoriteRoutes');
const instructorRoutes = require('./routes/instructorRoutes');
const instructorProfileRoutes = require('./routes/instructorProfileRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const userProfileRoutes = require('./routes/userProfileRoutes'); // ✅ NEW: Added user profile routes

// ✅ Use Routes
app.use("/api/user", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api", publicRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/instructors', instructorRoutes);
app.use('/api/instructor-profile', instructorProfileRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/user-profile', userProfileRoutes); // ✅ NEW: User profile routes

// ✅ Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// ✅ Production setup - Serve static files from React builds
if (process.env.NODE_ENV === 'production') {
    // Serve admin frontend on /admin route
    app.use('/admin', express.static(path.join(__dirname, '../admin-frontend/build')));
    
    // Serve user frontend (main app)
    app.use(express.static(path.join(__dirname, '../mern-auth-frontend/build')));
    
    // Handle React Router for admin frontend
    app.get('/admin/*', (req, res) => {
        res.sendFile(path.join(__dirname, '../admin-frontend/build', 'index.html'));
    });
    
    // Handle React Router for user frontend (catch all for non-API routes)
    app.get('*', (req, res) => {
        // Don't serve frontend for API routes
        if (req.path.startsWith('/api/')) {
            return res.status(404).json({ error: 'API route not found' });
        }
        res.sendFile(path.join(__dirname, '../mern-auth-frontend/build', 'index.html'));
    });
}

// ✅ Connect to DB and Start Server
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log("✅ MongoDB Connected");
        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            if (process.env.NODE_ENV === 'production') {
                console.log(`🌐 Production mode - Serving frontend files`);
                console.log(`👤 User Frontend: Available at root /`);
                console.log(`🔧 Admin Frontend: Available at /admin`);
            } else {
                console.log(`📡 CORS enabled for origins: http://localhost:3000, http://localhost:3001, http://localhost:3002`);
            }
        });
    })
    .catch((err) => console.error("❌ Mongo Error:", err));

// 📍 ROUTES BREAKDOWN:
// - authRoutes: /api/user/* (login, signup, basic profile)
// - userProfileRoutes: /api/user-profile/* (extended profile data)
// 
// Frontend will call:
// GET /api/user-profile/profile - to get complete profile
// PUT /api/user-profile/profile - to update complete profile
//
// 🚀 PRODUCTION DEPLOYMENT:
// - User Frontend: https://your-app.railway.app/
// - Admin Frontend: https://your-app.railway.app/admin
// - API: https://your-app.railway.app/api/*