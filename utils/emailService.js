// emailService.js - Create this new file in your utils or services folder

const nodemailer = require('nodemailer');

// Create transporter (you already have this)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Email templates
const generatePurchaseConfirmationHTML = (order) => {
    const coursesList = order.items.map(item => `
        <div style="border: 1px solid #e0e0e0; border-radius: 8px; padding: 15px; margin: 10px 0; background: #f9f9f9;">
            <h3 style="margin: 0 0 10px 0; color: #333;">${item.course.title}</h3>
            <p style="margin: 5px 0; color: #666;">${item.course.description ? item.course.description.substring(0, 100) + '...' : 'Course Description'}</p>
            <p style="margin: 5px 0; font-weight: bold; color: #2c5aa0;">Price: ₹${item.price}</p>
            <p style="margin: 5px 0; color: #666;">Quantity: ${item.quantity}</p>
        </div>
    `).join('');

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Purchase Confirmation</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">🎉 Thank You for Your Purchase!</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Your learning journey begins now</p>
        </div>
        
        <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Hi ${order.customerInfo.firstName}!</h2>
            
            <p style="font-size: 16px; margin: 20px 0;">
                We're excited to confirm that your purchase has been processed successfully! 
                You now have access to your new course(s) and can start learning right away.
            </p>
            
            <div style="background: #f8f9fa; border-left: 4px solid #28a745; padding: 20px; margin: 20px 0;">
                <h3 style="margin: 0 0 10px 0; color: #155724;">Order Details</h3>
                <p style="margin: 5px 0;"><strong>Order Number:</strong> ${order.orderNumber}</p>
                <p style="margin: 5px 0;"><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString('en-IN')}</p>
                <p style="margin: 5px 0;"><strong>Payment Status:</strong> ✅ Completed</p>
            </div>
            
            <h3 style="color: #333; margin: 30px 0 15px 0;">Your Courses:</h3>
            ${coursesList}
            
            <div style="background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px;">
                <h4 style="margin: 0 0 15px 0; color: #333;">Payment Summary</h4>
                <div style="display: flex; justify-content: space-between; margin: 8px 0;">
                    <span>Subtotal:</span>
                    <span>₹${order.pricing.subtotal}</span>
                </div>
                ${order.pricing.tax > 0 ? `
                <div style="display: flex; justify-content: space-between; margin: 8px 0;">
                    <span>Tax (GST):</span>
                    <span>₹${order.pricing.tax}</span>
                </div>
                ` : ''}
                ${order.pricing.shipping > 0 ? `
                <div style="display: flex; justify-content: space-between; margin: 8px 0;">
                    <span>Shipping:</span>
                    <span>₹${order.pricing.shipping}</span>
                </div>
                ` : ''}
                <hr style="margin: 15px 0;">
                <div style="display: flex; justify-content: space-between; margin: 8px 0; font-weight: bold; font-size: 18px; color: #28a745;">
                    <span>Total Paid:</span>
                    <span>₹${order.pricing.total}</span>
                </div>
            </div>
            
            <div style="background: #e7f3ff; border: 1px solid #bee5eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h4 style="margin: 0 0 10px 0; color: #0c5460;">🚀 What's Next?</h4>
                <ul style="margin: 10px 0; padding-left: 20px; color: #0c5460;">
                    <li>Access your courses anytime from your dashboard</li>
                    <li>Download course materials and resources</li>
                    <li>Track your progress and earn certificates</li>
                    <li>Join our community discussions</li>
                </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL}/my-courses" 
                   style="background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                    Access My Courses
                </a>
            </div>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin: 20px 0;">
                <h4 style="margin: 0 0 10px 0; color: #856404;">📞 Need Help?</h4>
                <p style="margin: 5px 0; color: #856404;">
                    Our support team is here to help! Contact us at 
                    <a href="mailto:support@yoursite.com" style="color: #007bff;">support@yoursite.com</a>
                    or reply to this email.
                </p>
            </div>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e0e0e0;">
            
            <div style="text-align: center; color: #666; font-size: 14px;">
                <p>Thank you for choosing us for your learning journey!</p>
                <p>Happy Learning! 📚✨</p>
                <p style="margin-top: 20px;">
                    <a href="${process.env.FRONTEND_URL}" style="color: #007bff; text-decoration: none;">Visit Our Website</a> | 
                    <a href="${process.env.FRONTEND_URL}/contact" style="color: #007bff; text-decoration: none;">Contact Support</a>
                </p>
            </div>
        </div>
    </body>
    </html>
    `;
};

// Plain text version for email clients that don't support HTML
const generatePurchaseConfirmationText = (order) => {
    const coursesList = order.items.map(item =>
        `- ${item.course.title} (₹${item.price} x ${item.quantity})`
    ).join('\n');

    return `
🎉 Thank You for Your Purchase!

Hi ${order.customerInfo.firstName}!

We're excited to confirm that your purchase has been processed successfully!

Order Details:
- Order Number: ${order.orderNumber}
- Order Date: ${new Date(order.createdAt).toLocaleDateString('en-IN')}
- Payment Status: Completed

Your Courses:
${coursesList}

Payment Summary:
- Subtotal: ₹${order.pricing.subtotal}
${order.pricing.tax > 0 ? `- Tax (GST): ₹${order.pricing.tax}` : ''}
${order.pricing.shipping > 0 ? `- Shipping: ₹${order.pricing.shipping}` : ''}
- Total Paid: ₹${order.pricing.total}

What's Next?
• Access your courses anytime from your dashboard
• Download course materials and resources
• Track your progress and earn certificates
• Join our community discussions

Access your courses: ${process.env.FRONTEND_URL}/my-courses

Need help? Contact us at support@yoursite.com

Thank you for choosing us for your learning journey!
Happy Learning! 📚✨
    `;
};

// Main function to send purchase confirmation email
const sendPurchaseConfirmationEmail = async (order) => {
    try {
        console.log('📧 Sending purchase confirmation email to:', order.customerInfo.email);

        const mailOptions = {
            from: {
                name: 'Your Learning Platform', // Change this to your site name
                address: process.env.EMAIL_USER
            },
            to: order.customerInfo.email,
            subject: `🎉 Purchase Confirmation - Order ${order.orderNumber}`,
            html: generatePurchaseConfirmationHTML(order),
            text: generatePurchaseConfirmationText(order)
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Purchase confirmation email sent successfully:', info.messageId);

        return {
            success: true,
            messageId: info.messageId
        };

    } catch (error) {
        console.error('❌ Error sending purchase confirmation email:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

// Optional: Send welcome email with course access details
const sendWelcomeEmail = async (order) => {
    try {
        console.log('📧 Sending welcome email to:', order.customerInfo.email);

        const mailOptions = {
            from: {
                name: 'Your Learning Platform',
                address: process.env.EMAIL_USER
            },
            to: order.customerInfo.email,
            subject: `Welcome to Your Learning Journey! 🚀`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h1 style="color: #333;">Welcome ${order.customerInfo.firstName}!</h1>
                    <p>Your courses are ready and waiting for you. Start your learning journey today!</p>
                    <div style="text-align: center; margin: 20px 0;">
                        <a href="${process.env.FRONTEND_URL}/my-courses" 
                           style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                            Start Learning Now
                        </a>
                    </div>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Welcome email sent successfully:', info.messageId);

        return {
            success: true,
            messageId: info.messageId
        };

    } catch (error) {
        console.error('❌ Error sending welcome email:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

module.exports = {
    sendPurchaseConfirmationEmail,
    sendWelcomeEmail
};