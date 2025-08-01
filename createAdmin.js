const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Admin = require("./models/Admin"); // Adjust the path if needed

dotenv.config();

async function createAdmin() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const email = "admin@example.com";    // Your admin email
        const password = "admin123";           // Your admin password (plain text!)

        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) {
            console.log("Admin already exists");
            process.exit(0);
        }

        // Create new admin without manual hashing (schema will hash it)
        const admin = new Admin({ email, password });
        await admin.save();

        console.log("Admin user created successfully");
        process.exit(0);
    } catch (error) {
        console.error("Error creating admin:", error);
        process.exit(1);
    }
}

createAdmin();
