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
    origin: (origin, callback) => {
        const allowedOrigins = [
            "http://localhost:3000",
            "http://localhost:3001",
            "http://localhost:3002",
            "https://edu-user-frontend.vercel.app",
            "https://edu-admin-frontend-beta.vercel.app"
        ];
        
        // Allow any Vercel deployment URL for your projects
        const isVercelDeployment = origin && (
            origin.includes('edu-user-frontend') && origin.includes('vercel.app') ||
            origin.includes('edu-admin-frontend') && origin.includes('vercel.app')
        );
        
        if (!origin || allowedOrigins.includes(origin) || isVercelDeployment) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
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
const progressRoutes = require('./routes/progressRoutes'); // ✅ NEW: Added progress routes
const enrollmentRoutes = require('./routes/enrollmentRoutes'); // ✅ NEW: Added enrollment routes

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
app.use('/api/progress', progressRoutes); // ✅ NEW: Progress routes
app.use('/api/enrollments', enrollmentRoutes); // ✅ NEW: Enrollment routes

// ✅ Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(500).json({
        error: 'Something went wrong!',
        message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
    });
});

// ✅ Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// ✅ API-only deployment - No frontend serving
app.get('/', (req, res) => {
    res.json({
        message: 'Education Platform API',
        status: 'Running',
        version: '1.0.0',
        endpoints: {
            health: '/api/health',
            auth: '/api/user/*',
            admin: '/api/admin/*',
            courses: '/api/courses',
            cart: '/api/cart/*',
            orders: '/api/orders/*'
        }
    });
});

// Handle 404 for non-API routes
app.get('*', (req, res) => {
    if (!req.path.startsWith('/api/')) {
        return res.status(404).json({ 
            error: 'Route not found',
            message: 'This is an API-only server. Frontend is deployed separately.'
        });
    }
});

// ✅ Connect to DB and Start Server
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log("✅ MongoDB Connected");
        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`📡 API Base URL: /api`);
            console.log(`✅ Health check: /api/health`);
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
