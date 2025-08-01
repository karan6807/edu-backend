const express = require("express");
const router = express.Router();

const {
    submitContact,
    getAllContacts,
    updateContactStatus,
    deleteContact,
    getContactStats
} = require("../controllers/contactController");

const adminAuthenticate = require("../middleware/adminMiddleware");

// ✅ Public Routes (No Authentication Required)
router.post("/submit", submitContact);                                  // POST /api/contact/submit

// ✅ Admin Routes (Authentication Required)
router.get("/admin/all", adminAuthenticate, getAllContacts);           // GET /api/contact/admin/all
router.get("/admin/stats", adminAuthenticate, getContactStats);        // GET /api/contact/admin/stats
router.put("/admin/status/:id", adminAuthenticate, updateContactStatus); // PUT /api/contact/admin/status/:id ✅ FIXED
router.delete("/admin/delete/:id", adminAuthenticate, deleteContact);   // DELETE /api/contact/admin/delete/:id ✅ FIXED

module.exports = router;