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

// Send expense submission notification to manager
const sendExpenseSubmittedEmail = async (
  managerEmail,
  managerName,
  employeeName,
  expenseDetails
) => {
  try {
    const transporter = createTransporter();
    const { amount, category, description, date, currency } = expenseDetails;

    const mailOptions = {
      from: `"Expense Management" <${process.env.EMAIL_USER}>`,
      to: managerEmail,
      subject: `New Expense Submitted by ${employeeName} - Pending Approval`,
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
              border-bottom: 2px solid #3B82F6;
            }
            .header h1 {
              color: #3B82F6;
              margin: 0;
            }
            .content {
              padding: 30px 0;
            }
            .expense-details {
              background: #EFF6FF;
              border-left: 4px solid #3B82F6;
              padding: 20px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .detail-row {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-bottom: 1px solid #DBEAFE;
            }
            .detail-row:last-child {
              border-bottom: none;
            }
            .label {
              font-weight: bold;
              color: #1E40AF;
            }
            .value {
              color: #333;
            }
            .action-button {
              display: inline-block;
              background: #3B82F6;
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 6px;
              margin: 20px 10px;
              font-weight: bold;
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
              <h1>📋 New Expense Submitted</h1>
            </div>
            <div class="content">
              <p>Hello <strong>${managerName}</strong>,</p>
              <p><strong>${employeeName}</strong> has submitted a new expense that requires your approval.</p>
              
              <div class="expense-details">
                <div class="detail-row">
                  <span class="label">Employee:</span>
                  <span class="value">${employeeName}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Amount:</span>
                  <span class="value">${currency} ${amount}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Category:</span>
                  <span class="value">${category}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Date:</span>
                  <span class="value">${new Date(
                    date
                  ).toLocaleDateString()}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Description:</span>
                  <span class="value">${description}</span>
                </div>
              </div>
              
              <p style="text-align: center;">
                <strong>Please review and take action on this expense submission.</strong>
              </p>
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
    console.log("Expense submission email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending expense submission email:", error);
    return { success: false, error: error.message };
  }
};

// Send expense approval notification to employee
const sendExpenseApprovedEmail = async (
  employeeEmail,
  employeeName,
  expenseDetails,
  approverName
) => {
  try {
    const transporter = createTransporter();
    const { amount, category, description, date, currency } = expenseDetails;

    const mailOptions = {
      from: `"Expense Management" <${process.env.EMAIL_USER}>`,
      to: employeeEmail,
      subject: `✅ Expense Approved - ${currency} ${amount}`,
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
              border-bottom: 2px solid #10B981;
            }
            .header h1 {
              color: #10B981;
              margin: 0;
            }
            .content {
              padding: 30px 0;
            }
            .success-badge {
              background: #D1FAE5;
              color: #065F46;
              padding: 15px;
              text-align: center;
              font-size: 18px;
              font-weight: bold;
              margin: 20px 0;
              border-radius: 8px;
              border: 2px solid #10B981;
            }
            .expense-details {
              background: #F0FDF4;
              border-left: 4px solid #10B981;
              padding: 20px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .detail-row {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-bottom: 1px solid #D1FAE5;
            }
            .detail-row:last-child {
              border-bottom: none;
            }
            .label {
              font-weight: bold;
              color: #065F46;
            }
            .value {
              color: #333;
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
              <h1>✅ Expense Approved!</h1>
            </div>
            <div class="content">
              <p>Hello <strong>${employeeName}</strong>,</p>
              
              <div class="success-badge">
                Your expense has been approved! 🎉
              </div>
              
              <p>Great news! Your expense submission has been reviewed and approved by <strong>${approverName}</strong>.</p>
              
              <div class="expense-details">
                <div class="detail-row">
                  <span class="label">Amount:</span>
                  <span class="value">${currency} ${amount}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Category:</span>
                  <span class="value">${category}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Date:</span>
                  <span class="value">${new Date(
                    date
                  ).toLocaleDateString()}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Description:</span>
                  <span class="value">${description}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Approved By:</span>
                  <span class="value">${approverName}</span>
                </div>
              </div>
              
              <p>The approved amount will be processed according to your company's reimbursement schedule.</p>
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
    console.log("Expense approval email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending expense approval email:", error);
    return { success: false, error: error.message };
  }
};

// Send expense rejection notification to employee
const sendExpenseRejectedEmail = async (
  employeeEmail,
  employeeName,
  expenseDetails,
  rejectorName,
  reason
) => {
  try {
    const transporter = createTransporter();
    const { amount, category, description, date, currency } = expenseDetails;

    const mailOptions = {
      from: `"Expense Management" <${process.env.EMAIL_USER}>`,
      to: employeeEmail,
      subject: `❌ Expense Rejected - ${currency} ${amount}`,
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
              border-bottom: 2px solid #EF4444;
            }
            .header h1 {
              color: #EF4444;
              margin: 0;
            }
            .content {
              padding: 30px 0;
            }
            .rejection-badge {
              background: #FEE2E2;
              color: #991B1B;
              padding: 15px;
              text-align: center;
              font-size: 18px;
              font-weight: bold;
              margin: 20px 0;
              border-radius: 8px;
              border: 2px solid #EF4444;
            }
            .expense-details {
              background: #FEF2F2;
              border-left: 4px solid #EF4444;
              padding: 20px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .detail-row {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-bottom: 1px solid #FEE2E2;
            }
            .detail-row:last-child {
              border-bottom: none;
            }
            .label {
              font-weight: bold;
              color: #991B1B;
            }
            .value {
              color: #333;
            }
            .reason-box {
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
              <h1>❌ Expense Rejected</h1>
            </div>
            <div class="content">
              <p>Hello <strong>${employeeName}</strong>,</p>
              
              <div class="rejection-badge">
                Your expense has been rejected
              </div>
              
              <p>Your expense submission has been reviewed and rejected by <strong>${rejectorName}</strong>.</p>
              
              <div class="expense-details">
                <div class="detail-row">
                  <span class="label">Amount:</span>
                  <span class="value">${currency} ${amount}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Category:</span>
                  <span class="value">${category}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Date:</span>
                  <span class="value">${new Date(
                    date
                  ).toLocaleDateString()}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Description:</span>
                  <span class="value">${description}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Rejected By:</span>
                  <span class="value">${rejectorName}</span>
                </div>
              </div>
              
              <div class="reason-box">
                <strong>📝 Rejection Reason:</strong><br>
                ${reason || "No reason provided"}
              </div>
              
              <p>If you have questions about this rejection, please contact <strong>${rejectorName}</strong> or your manager for clarification.</p>
              <p>You may submit a revised expense with the necessary corrections if appropriate.</p>
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
    console.log("Expense rejection email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending expense rejection email:", error);
    return { success: false, error: error.message };
  }
};

// Send welcome email to new user
const sendWelcomeEmail = async (
  userEmail,
  userName,
  role,
  companyName,
  temporaryPassword
) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"Expense Management" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: `Welcome to ${companyName} - Expense Management System`,
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
              border-bottom: 2px solid #8B5CF6;
            }
            .header h1 {
              color: #8B5CF6;
              margin: 0;
            }
            .content {
              padding: 30px 0;
            }
            .welcome-badge {
              background: #EDE9FE;
              color: #5B21B6;
              padding: 20px;
              text-align: center;
              font-size: 20px;
              font-weight: bold;
              margin: 20px 0;
              border-radius: 8px;
              border: 2px solid #8B5CF6;
            }
            .credentials-box {
              background: #F5F3FF;
              border-left: 4px solid #8B5CF6;
              padding: 20px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .credential-row {
              padding: 8px 0;
              border-bottom: 1px solid #DDD6FE;
            }
            .credential-row:last-child {
              border-bottom: none;
            }
            .label {
              font-weight: bold;
              color: #5B21B6;
            }
            .value {
              color: #333;
              font-family: monospace;
              background: #EDE9FE;
              padding: 5px 10px;
              border-radius: 4px;
              margin-top: 5px;
              display: inline-block;
            }
            .warning {
              background: #FEF3C7;
              border-left: 4px solid #F59E0B;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .steps {
              background: #F0F9FF;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .step {
              padding: 10px 0;
              border-bottom: 1px solid #DBEAFE;
            }
            .step:last-child {
              border-bottom: none;
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
              <h1>🎉 Welcome Aboard!</h1>
            </div>
            <div class="content">
              <div class="welcome-badge">
                Welcome to ${companyName}!
              </div>
              
              <p>Hello <strong>${userName}</strong>,</p>
              <p>Your account has been created in the Expense Management System. You have been assigned the role of <strong>${role.toUpperCase()}</strong>.</p>
              
              <div class="credentials-box">
                <div class="credential-row">
                  <div class="label">📧 Email:</div>
                  <div class="value">${userEmail}</div>
                </div>
                <div class="credential-row">
                  <div class="label">🔑 Temporary Password:</div>
                  <div class="value">${temporaryPassword}</div>
                </div>
                <div class="credential-row">
                  <div class="label">👤 Role:</div>
                  <div class="value">${role.toUpperCase()}</div>
                </div>
              </div>
              
              <div class="warning">
                <strong>🔒 Security Notice:</strong> For your security, please change your password immediately after your first login.
              </div>
              
              <div class="steps">
                <strong>Getting Started:</strong>
                <div class="step">1️⃣ Visit the expense management portal</div>
                <div class="step">2️⃣ Log in with your email and temporary password</div>
                <div class="step">3️⃣ Change your password from the Settings menu</div>
                <div class="step">4️⃣ Start managing your expenses!</div>
              </div>
              
              <p><strong>Your Role Permissions:</strong></p>
              <ul>
                ${
                  role === "employee"
                    ? `
                  <li>Submit expense reports</li>
                  <li>Upload receipts</li>
                  <li>Track expense status</li>
                  <li>Export your expense history</li>
                `
                    : role === "manager"
                    ? `
                  <li>Approve/reject employee expenses</li>
                  <li>View team expense reports</li>
                  <li>Submit your own expenses</li>
                  <li>Export team expense data</li>
                `
                    : `
                  <li>Full system access</li>
                  <li>Manage users and roles</li>
                  <li>View all company expenses</li>
                  <li>Generate comprehensive reports</li>
                `
                }
              </ul>
              
              <p>If you have any questions or need assistance, please contact your system administrator.</p>
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
    console.log("Welcome email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending welcome email:", error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  generateResetCode,
  sendResetEmail,
  sendExpenseSubmittedEmail,
  sendExpenseApprovedEmail,
  sendExpenseRejectedEmail,
  sendWelcomeEmail,
};
