const Contact = require("../models/Contact");
const nodemailer = require("nodemailer");

// Email transporter setup (same as in authController)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Submit contact form
const submitContact = async (req, res) => {
    try {
        const { name, email, phone, subject, message } = req.body;

        // Validation
        if (!name || !email || !subject || !message) {
            return res.status(400).json({
                success: false,
                message: "All required fields must be filled"
            });
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid email address"
            });
        }

        // Create new contact
        const newContact = new Contact({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            phone: phone ? phone.trim() : '',
            subject: subject.trim(),
            message: message.trim(),
            status: 'unread'
        });

        // Save contact
        const savedContact = await newContact.save();

        // Send confirmation email to user
        const userMailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Thank you for contacting us!',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Thank you for reaching out!</h2>
                    <p>Dear ${name},</p>
                    <p>We have received your message and will get back to you soon.</p>
                    
                    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <h3 style="margin-top: 0; color: #555;">Your Message Details:</h3>
                        <p><strong>Subject:</strong> ${subject}</p>
                        <p><strong>Submitted:</strong> ${savedContact.submittedAt.toLocaleString('en-US', { 
                            timeZone: 'Asia/Kolkata',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                        })}</p>
                        <p><strong>Message:</strong></p>
                        <p style="background-color: white; padding: 10px; border-radius: 3px;">${message}</p>
                    </div>
                    
                    <p>Best regards,<br>Your Support Team</p>
                </div>
            `
        };

        // Send notification email to admin
        const adminMailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
            subject: `New Contact Form Submission - ${subject}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #d32f2f;">New Contact Form Submission</h2>
                    
                    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <h3 style="margin-top: 0; color: #555;">Contact Details:</h3>
                        <p><strong>Name:</strong> ${name}</p>
                        <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
                        <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
                        <p><strong>Subject:</strong> ${subject}</p>
                        <p><strong>Submitted:</strong> ${savedContact.submittedAt.toLocaleString('en-US', { 
                            timeZone: 'Asia/Kolkata',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                        })}</p>
                    </div>
                    
                    <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107;">
                        <h3 style="margin-top: 0; color: #856404;">Message:</h3>
                        <p style="white-space: pre-wrap;">${message}</p>
                    </div>
                    
                    <p style="margin-top: 20px;">
                        <a href="mailto:${email}?subject=Re: ${subject}" 
                           style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                            Reply to ${name}
                        </a>
                    </p>
                </div>
            `
        };

        // Send emails (don't wait for them to complete)
        try {
            await transporter.sendMail(userMailOptions);
            await transporter.sendMail(adminMailOptions);
        } catch (emailError) {
            console.error('Email sending failed:', emailError);
            // Don't fail the entire request if email fails
        }

        res.status(201).json({
            success: true,
            message: "Thank you for your message! We'll get back to you soon.",
            contact: {
                id: savedContact._id,
                name: savedContact.name,
                email: savedContact.email,
                subject: savedContact.subject,
                submittedAt: savedContact.submittedAt
            }
        });

    } catch (error) {
        console.error('Contact submission error:', error);
        res.status(500).json({
            success: false,
            message: "Sorry, there was an error processing your request. Please try again."
        });
    }
};

// Admin: Get all contacts
const getAllContacts = async (req, res) => {
    try {
        const contacts = await Contact.find({})
            .sort({ submittedAt: -1 })
            .lean();

        res.status(200).json({
            success: true,
            contacts: contacts,
            count: contacts.length
        });

    } catch (error) {
        console.error('Error fetching contacts:', error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch contacts"
        });
    }
};

// Admin: Update contact status
const updateContactStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        // ✅ UPDATED: Added "pending" to valid statuses
        const validStatuses = ['unread', 'read', 'pending', 'replied', 'resolved'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status. Must be one of: unread, read, pending, replied, resolved"
            });
        }

        const contact = await Contact.findByIdAndUpdate(
            id,
            { status },
            { new: true, runValidators: true }
        );

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: "Contact not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Contact status updated successfully",
            contact
        });

    } catch (error) {
        console.error('Error updating contact status:', error);
        res.status(500).json({
            success: false,
            message: "Failed to update contact status"
        });
    }
};

// Admin: Delete contact
const deleteContact = async (req, res) => {
    try {
        const { id } = req.params;

        const contact = await Contact.findByIdAndDelete(id);

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: "Contact not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Contact deleted successfully"
        });

    } catch (error) {
        console.error('Error deleting contact:', error);
        res.status(500).json({
            success: false,
            message: "Failed to delete contact"
        });
    }
};

// Admin: Get contact statistics
const getContactStats = async (req, res) => {
    try {
        const stats = await Contact.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        // ✅ UPDATED: Added "pending" to formatted stats
        const formattedStats = {
            total: 0,
            unread: 0,
            read: 0,
            pending: 0,  // ✅ ADDED
            replied: 0,
            resolved: 0
        };

        stats.forEach(stat => {
            formattedStats[stat._id] = stat.count;
            formattedStats.total += stat.count;
        });

        res.status(200).json({
            success: true,
            stats: formattedStats
        });

    } catch (error) {
        console.error('Error fetching contact stats:', error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch contact statistics"
        });
    }
};

module.exports = {
    submitContact,
    getAllContacts,
    updateContactStatus,
    deleteContact,
    getContactStats
};