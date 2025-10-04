const nodemailer = require("nodemailer");

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// Generate random 6-digit code
const generateResetCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send password reset email
const sendResetEmail = async (email, resetCode, userName) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"Expense Management" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Password Reset Code - Expense Management",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f4f4f4;
              padding: 20px;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: white;
              padding: 40px;
              border-radius: 10px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center;
              padding-bottom: 20px;
              border-bottom: 2px solid #4F46E5;
            }
            .header h1 {
              color: #4F46E5;
              margin: 0;
            }
            .content {
              padding: 30px 0;
            }
            .reset-code {
              background: #EEF2FF;
              border: 2px dashed #4F46E5;
              padding: 20px;
              text-align: center;
              font-size: 32px;
              font-weight: bold;
              color: #4F46E5;
              letter-spacing: 5px;
              margin: 20px 0;
              border-radius: 8px;
            }
            .warning {
              background: #FEF3C7;
              border-left: 4px solid #F59E0B;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .footer {
              text-align: center;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              color: #666;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hello <strong>${userName}</strong>,</p>
              <p>We received a request to reset your password for your Expense Management account.</p>
              <p>Please use the following verification code to proceed with resetting your password:</p>
              
              <div class="reset-code">${resetCode}</div>
              
              <p>This code will expire in <strong>10 minutes</strong>.</p>
              
              <div class="warning">
                <strong>⚠️ Security Notice:</strong> If you didn't request this password reset, please ignore this email and ensure your account is secure.
              </div>
              
              <p>After verifying this code, you will be able to set a new password for your account.</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply to this message.</p>
              <p>&copy; 2025 Expense Management System. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Reset email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending reset email:", error);
    throw new Error("Failed to send reset email");
  }
};

module.exports = {
  generateResetCode,
  sendResetEmail,
};
