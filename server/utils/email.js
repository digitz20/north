const nodemailer = require('nodemailer');
const logger = require('./logger');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initialize();
  }

  initialize() {
    // Always use Gmail for all environments (development + production)
    this.createProductionTransporter();
  }

  createProductionTransporter() {
    // Gmail SMTP configuration
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER, // your gmail address
        pass: process.env.SMTP_PASS  // your app password
      }
    });
  }

  async createTestAccount() {
    // Generate test SMTP service account from ethereal.email
    const testAccount = await nodemailer.createTestAccount();
    
    this.transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });

    logger.info(`Ethereal Email account created: ${testAccount.user}`);
  }

  // Base HTML template with professional banking styling
  #getBaseTemplate(content, title) {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333333;
            margin: 0;
            padding: 0;
            background-color: #f8f9fa;
          }
          .email-container {
            max-width: 600px;
            margin: 20px auto;
            background: #ffffff;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
          }
          .email-header {
            background: #0a2463;
            color: white;
            padding: 25px 30px;
            text-align: center;
          }
          .email-header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
          }
          .email-body {
            padding: 30px;
          }
          .email-body h2 {
            color: #0a2463;
            margin-top: 0;
            font-size: 22px;
          }
          .email-footer {
            background: #f1f3f5;
            padding: 20px 30px;
            text-align: center;
            font-size: 12px;
            color: #666666;
          }
          .otp-box {
            font-size: 36px;
            letter-spacing: 12px;
            text-align: center;
            padding: 25px;
            background: #f8f9fa;
            border-radius: 8px;
            margin: 25px 0;
            font-weight: bold;
            color: #0a2463;
          }
          .transaction-details {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .transaction-details ul {
            list-style: none;
            padding: 0;
            margin: 0;
          }
          .transaction-details li {
            padding: 8px 0;
            border-bottom: 1px solid #e9ecef;
          }
          .transaction-details li:last-child {
            border-bottom: none;
          }
          .transaction-details strong {
            min-width: 140px;
            display: inline-block;
          }
          .alert-warning {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="email-header">
            <h1>NorthCrest Bank</h1>
          </div>
          <div class="email-body">
            <h2>${title}</h2>
            ${content}
          </div>
          <div class="email-footer">
            <p>© 2026 NorthCrest Bank of USA. All rights reserved.</p>
            <p>123 Financial Center Drive, New York, NY 10001 | support@northcrestbank.com</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async sendEmail(options) {
    const { to, subject, html, text, attachments = [] } = options;

    if (!this.transporter) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const mailOptions = {
      from: `"NorthCrest Bank" <${process.env.SMTP_USER}>`,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject: `NorthCrest Bank: ${subject}`,
      text: text || this.stripHtml(html),
      html,
      attachments
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      
      if (process.env.NODE_ENV === 'development') {
        logger.info(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
      }
      
      logger.info(`Email sent: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      logger.error(`Failed to send email: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  // Welcome email template
  async sendWelcomeEmail(user) {
    const content = `
      <p>Dear ${user.firstName} ${user.lastName},</p>
      <p>Thank you for choosing NorthCrest Bank as your trusted banking partner. Your account has been successfully created and is ready to use.</p>
      <p>To get started with your account, please complete the following steps:</p>
      <ol>
        <li>Verify your email address using the verification code sent to your inbox</li>
        <li>Complete your KYC verification to unlock all banking features</li>
        <li>Set up your security questions and two-factor authentication</li>
      </ol>
      <p>If you have any questions or need assistance, our 24/7 support team is always here to help. You can reach us at support@northcrestbank.com or call 1-800-NORTHCREST.</p>
      <p>Best regards,<br><strong>The NorthCrest Bank Team</strong></p>
    `;

    const html = this.#getBaseTemplate(content, 'Welcome to NorthCrest Bank');

    return this.sendEmail({
      to: user.email,
      subject: 'Welcome to NorthCrest Bank',
      html
    });
  }

  // Verification email
  async sendVerificationEmail(user, otpCode) {
    const content = `
      <p>Dear ${user.firstName} ${user.lastName},</p>
      <p>Please use the following verification code to confirm your email address:</p>
      <div class="otp-box">${otpCode}</div>
      <p>This code will expire in 15 minutes. If you didn't request this verification, please ignore this email or contact our security team immediately.</p>
    `;

    const html = this.#getBaseTemplate(content, 'Verify Your Email Address');

    return this.sendEmail({
      to: user.email,
      subject: 'Verify Your Email Address',
      html
    });
  }

  // Password reset email
  async sendPasswordResetEmail(user, otpCode) {
    const content = `
      <p>Dear ${user.firstName} ${user.lastName},</p>
      <p>You have requested to reset your NorthCrest Bank account password. Use the following verification code to proceed:</p>
      <div class="otp-box">${otpCode}</div>
      <p>This code will expire in 15 minutes.</p>
      <div class="alert-warning">
        <p><strong>Important:</strong> If you did not request a password reset, please contact our security team immediately at security@northcrestbank.com to secure your account.</p>
      </div>
    `;

    const html = this.#getBaseTemplate(content, 'Reset Your Password');

    return this.sendEmail({
      to: user.email,
      subject: 'Reset Your Password',
      html
    });
  }

  // Transaction alert
  async sendTransactionAlert(user, transaction) {
    const direction = transaction.direction === 'credit' ? 'received' : 'sent';
    const content = `
      <p>Dear ${user.firstName} ${user.lastName},</p>
      <p>A transaction of <strong>$${transaction.amount.toFixed(2)}</strong> has been ${direction} from your account.</p>
      <div class="transaction-details">
        <ul>
          <li><strong>Transaction ID:</strong> ${transaction.transactionId}</li>
          <li><strong>Amount:</strong> $${transaction.amount.toFixed(2)}</li>
          <li><strong>Type:</strong> ${transaction.type}</li>
          <li><strong>Status:</strong> ${transaction.status}</li>
          <li><strong>Date:</strong> ${new Date().toLocaleString()}</li>
          <li><strong>Description:</strong> ${transaction.description}</li>
        </ul>
      </div>
      <div class="alert-warning">
        <p>If you did not authorize this transaction, please contact our security team immediately to report unauthorized activity.</p>
      </div>
    `;

    const html = this.#getBaseTemplate(content, `Transaction Alert: ${transaction.transactionId}`);

    return this.sendEmail({
      to: user.email,
      subject: `Transaction Alert: ${transaction.transactionId}`,
      html
    });
  }

  // Login alert
  async sendLoginAlert(user, session) {
    const content = `
      <p>Dear ${user.firstName} ${user.lastName},</p>
      <p>We detected a new login to your NorthCrest Bank account from a new device:</p>
      <div class="transaction-details">
        <ul>
          <li><strong>IP Address:</strong> ${session.ip}</li>
          <li><strong>Device:</strong> ${session.device || 'Unknown'}</li>
          <li><strong>Browser:</strong> ${session.browser || 'Unknown'}</li>
          <li><strong>Location:</strong> ${session.location?.city || 'Unknown'}, ${session.location?.country || 'Unknown'}</li>
          <li><strong>Time:</strong> ${new Date().toLocaleString()}</li>
        </ul>
      </div>
      <div class="alert-warning">
        <p>If this was not you, please secure your account immediately by changing your password and contacting our support team at 1-800-NORTHCREST.</p>
      </div>
    `;

    const html = this.#getBaseTemplate(content, 'New Login Detected on Your Account');

    return this.sendEmail({
      to: user.email,
      subject: 'New Login Detected',
      html
    });
  }

  stripHtml(html) {
    return html.replace(/<[^>]*>/g, '');
  }
}

module.exports = new EmailService();