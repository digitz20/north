const nodemailer = require('nodemailer');
const logger = require('./logger');
const EmailLog = require('../models/EmailLog');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initialize();
  }

  initialize() {
    this.createProductionTransporter();
  }

  createProductionTransporter() {
    const cleanSmtpPass = process.env.SMTP_PASS ? process.env.SMTP_PASS.replace(/\s+/g, '') : '';
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: cleanSmtpPass
      }
    });
  }

  async createTestAccount() {
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

    let attempts = 0;
    while (!this.transporter && attempts < 5) {
      await new Promise(resolve => setTimeout(resolve, 500));
      attempts++;
    }

    if (!this.transporter) {
      logger.error('Email transporter failed to initialize');
      return { success: false, error: 'Email service not initialized' };
    }

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      logger.error('SMTP credentials not configured properly');
      return { success: false, error: 'Email service configuration error' };
    }

    const mailOptions = {
      from: `"NorthCrest Bank" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject: `NorthCrest Bank: ${subject}`,
      text: text || this.stripHtml(html),
      html,
      attachments
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      if (process.env.NODE_ENV === 'development') {
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) logger.info(`Email preview URL: ${previewUrl}`);
      }
      logger.info(`Email sent successfully to ${to}: ${info.messageId}`);

      EmailLog.create({
        to: Array.isArray(to) ? to.join(', ') : to,
        cc: options.cc || [],
        bcc: options.bcc || [],
        subject: subject,
        body: text || html,
        category: options.category || 'other',
        status: 'sent',
        messageId: info.messageId,
        sentBy: options.sentBy || 'system',
        relatedUser: options.relatedUser || null,
        relatedModel: options.relatedModel || null,
        relatedId: options.relatedId || null,
        metadata: options.metadata || {}
      }).catch(err => logger.error(`Failed to log email: ${err.message}`));

      return { success: true, messageId: info.messageId };
    } catch (error) {
      logger.error(`Failed to send email to ${to}: ${error.message}`);

      EmailLog.create({
        to: Array.isArray(to) ? to.join(', ') : to,
        subject: subject,
        body: text || html,
        category: options.category || 'other',
        status: 'failed',
        error: error.message,
        sentBy: options.sentBy || 'system',
        relatedUser: options.relatedUser || null,
        relatedModel: options.relatedModel || null,
        relatedId: options.relatedId || null
      }).catch(err => logger.error(`Failed to log failed email: ${err.message}`));

      return { success: false, error: error.message };
    }
  }

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

  async sendTransactionAlert(user, transaction) {
    const {
      type,
      direction,
      amount,
      status,
      transactionId,
      description,
      method,
      recipient,
      sender,
      paymentMethod
    } = transaction;

    const amountFormatted = amount != null ? `$${Number(amount).toFixed(2)}` : '$0.00';
    const date = new Date().toLocaleString();
    const normalizedType = String(type || '').toLowerCase();

    const details = `
      <div class="transaction-details">
        <ul>
          <li><strong>Transaction ID:</strong> ${transactionId}</li>
          <li><strong>Amount:</strong> ${amountFormatted}</li>
          <li><strong>Status:</strong> ${status}</li>
          <li><strong>Date:</strong> ${date}</li>
          ${description ? `<li><strong>Description:</strong> ${description}</li>` : ''}
          ${method ? `<li><strong>Method:</strong> ${method}</li>` : ''}
          ${paymentMethod ? `<li><strong>Payment Method:</strong> ${paymentMethod}</li>` : ''}
          ${sender?.name ? `<li><strong>Sender:</strong> ${sender.name}</li>` : ''}
          ${recipient?.name ? `<li><strong>Recipient:</strong> ${recipient.name}</li>` : ''}
        </ul>
      </div>
    `;

    let title, subject, greeting;

    if (normalizedType === 'deposit') {
      title = 'Deposit Confirmation';
      subject = `Deposit Confirmation: ${transactionId}`;
      greeting = `<p>Dear ${user.firstName} ${user.lastName},</p>
        <p>We are pleased to confirm that your deposit of <strong>${amountFormatted}</strong> has been successfully processed and credited to your account.</p>`;
    } else if (normalizedType === 'transfer' || normalizedType === 'domestic') {
      title = 'Transfer Confirmation';
      subject = `Transfer Confirmation: ${transactionId}`;
      greeting = `<p>Dear ${user.firstName} ${user.lastName},</p>
        <p>Your transfer of <strong>${amountFormatted}</strong> ${direction === 'credit' ? 'has been received' : 'has been initiated'}. The transaction is currently <strong>${status}</strong>.</p>`;
    } else if (normalizedType === 'wire-transfer' || method === 'wire-transfer') {
      title = 'Wire Transfer Confirmation';
      subject = `Wire Transfer Confirmation: ${transactionId}`;
      greeting = `<p>Dear ${user.firstName} ${user.lastName},</p>
        <p>Your wire transfer of <strong>${amountFormatted}</strong> has been successfully initiated and is currently being processed.</p>
        <p>Please note that international wire transfers may take 1-3 business days to complete depending on the destination bank and currency.</p>`;
    } else if (normalizedType === 'bank-transfer' || method === 'bank-transfer') {
      title = 'Bank Transfer Confirmation';
      subject = `Bank Transfer Confirmation: ${transactionId}`;
      greeting = `<p>Dear ${user.firstName} ${user.lastName},</p>
        <p>Your bank transfer of <strong>${amountFormatted}</strong> has been successfully initiated and is currently being processed.</p>
        <p>Please note that international transfers may take 1-3 business days to complete depending on the destination bank and currency.</p>`;
    } else if (normalizedType === 'international' || normalizedType === 'international transfer') {
      title = 'International Bank Transfer Confirmation';
      subject = `International Bank Transfer Confirmation: ${transactionId}`;
      greeting = `<p>Dear ${user.firstName} ${user.lastName},</p>
        <p>Your international bank transfer of <strong>${amountFormatted}</strong> has been successfully initiated and is currently being processed.</p>
        <p>Please note that international transfers may take 1-3 business days to complete depending on the destination bank and currency.</p>`;
    } else if (normalizedType === 'crypto-withdrawal' || normalizedType === 'crypto-transfer') {
      title = 'Crypto Transfer Confirmation';
      subject = `Crypto Transfer Confirmation: ${transactionId}`;
      greeting = `<p>Dear ${user.firstName} ${user.lastName},</p>
        <p>Your cryptocurrency transfer of <strong>${amountFormatted}</strong> has been successfully initiated and is currently being processed on the blockchain.</p>`;
    } else if (normalizedType === 'withdrawal') {
      title = 'Withdrawal Confirmation';
      subject = `Withdrawal Confirmation: ${transactionId}`;
      greeting = `<p>Dear ${user.firstName} ${user.lastName},</p>
        <p>Your withdrawal request of <strong>${amountFormatted}</strong> has been successfully processed. The funds have been ${direction === 'credit' ? 'credited' : 'debited'} to your account.</p>`;
    } else if (normalizedType === 'investment') {
      title = 'Investment Confirmation';
      subject = `Investment Confirmation: ${transactionId}`;
      greeting = `<p>Dear ${user.firstName} ${user.lastName},</p>
        <p>Your investment of <strong>${amountFormatted}</strong> has been successfully created and is currently being processed.</p>`;
    } else {
      title = `${String(type).charAt(0).toUpperCase()}${String(type).slice(1)} Confirmation`;
      subject = `${title}: ${transactionId}`;
      greeting = `<p>Dear ${user.firstName} ${user.lastName},</p>
        <p>Your ${String(type).toLowerCase()} of <strong>${amountFormatted}</strong> has been processed. The transaction is currently <strong>${status}</strong>.</p>`;
    }

    const content = `
      ${greeting}
      ${details}
      <div class="alert-warning">
        <p>If you did not authorize this transaction, please contact our security team immediately to report unauthorized activity.</p>
      </div>
    `;

    const html = this.#getBaseTemplate(content, title);

    return this.sendEmail({
      to: user.email,
      subject,
      html
    });
  }

  async sendLoginAlert(user, session) {
    const content = `
      <p>Dear ${user.firstName} ${user.lastName},</p>
      <p>We detected a new login to your NorthCrest Bank account from a new device:</p>
      <div class="transaction-details">
        <ul>
          <li><strong>IP Address:</strong> ${session.ip}</li>
          ${session.device ? `<li><strong>Device:</strong> ${session.device}</li>` : ''}
          ${session.browser ? `<li><strong>Browser:</strong> ${session.browser}</li>` : ''}
          ${(session.location?.city && session.location?.country) ? `<li><strong>Location:</strong> ${session.location.city}, ${session.location.country}</li>` : ''}
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

  async sendInvestmentConfirmation(user, investment) {
    const categoryDisplay = investment.category === 'crypto' ? 'Cryptocurrency' :
                           investment.category === 'stocks' ? 'Stock Market' : 'Real Estate';

    const content = `
      <p>Dear ${user.firstName} ${user.lastName},</p>
      <p>Your investment application has been successfully received and is being processed by our team.</p>
      <div class="transaction-details">
        <ul>
          <li><strong>Investment ID:</strong> ${investment.investmentId || 'Pending'}</li>
          <li><strong>Category:</strong> ${categoryDisplay}</li>
          <li><strong>Plan:</strong> ${investment.planName}</li>
           <li><strong>Amount Invested:</strong> $${(investment.amount != null ? Number(investment.amount).toFixed(2) : investment.amountInvested != null ? Number(investment.amountInvested).toFixed(2) : '0.00')}</li>
          <li><strong>Status:</strong> Processing</li>
          <li><strong>Date Submitted:</strong> ${new Date().toLocaleString()}</li>
          <li><strong>Notification Email:</strong> ${investment.email}</li>
        </ul>
      </div>
      <p>Our team will verify your payment and activate your investment within 24-48 business hours. You will receive another email once your investment is fully active and starts generating returns.</p>
      <p>If you have any questions about your investment, please contact our investment support team at investments@northcrestbank.com or call 1-800-NORTHCREST.</p>
      <p>Thank you for choosing NorthCrest Bank to grow your wealth!</p>
      <p>Best regards,<br><strong>The NorthCrest Bank Investment Team</strong></p>
    `;

    const html = this.#getBaseTemplate(content, 'Investment Confirmation - Application Received');

    return this.sendEmail({
      to: user.email,
      subject: 'Investment Confirmation - Your Application Has Been Received',
      html,
      attachments: investment.proofImages || []
    });
  }

  async sendLoanApprovalEmail(user, loan) {
    const safeLoan = loan || {};
    const content = `
      <p>Dear ${user.firstName || ''} ${user.lastName || ''},</p>
      <p>Great news! Your loan application with NorthCrest Bank has been <strong>APPROVED</strong>. The funds have been successfully disbursed to your account.</p>
      <div class="transaction-details">
        <ul>
          <li><strong>Loan ID:</strong> ${safeLoan.loanId || 'N/A'}</li>
          <li><strong>Loan Type:</strong> ${safeLoan.loanProduct?.name || 'Personal Loan'}</li>
          <li><strong>Loan Amount:</strong> $${safeLoan.amount != null ? Number(safeLoan.amount).toFixed(2) : '0.00'}</li>
          <li><strong>Interest Rate:</strong> ${safeLoan.loanProduct?.interestRate || 0}% APR</li>
          <li><strong>Loan Term:</strong> ${safeLoan.term || 'N/A'} months</li>
          <li><strong>Monthly Payment (EMI):</strong> $${safeLoan.monthlyPayment != null ? Number(safeLoan.monthlyPayment).toFixed(2) : '0.00'}</li>
          <li><strong>Total Repayment Amount:</strong> $${safeLoan.monthlyPayment != null && safeLoan.term ? Number(safeLoan.monthlyPayment * safeLoan.term).toFixed(2) : '0.00'}</li>
          <li><strong>Approval Date:</strong> ${new Date().toLocaleString()}</li>
          <li><strong>First Payment Due Date:</strong> ${safeLoan.firstPaymentDate?.toLocaleDateString() || 'N/A'}</li>
          <li><strong>Last Payment Date:</strong> ${safeLoan.lastPaymentDate?.toLocaleDateString() || 'N/A'}</li>
          <li><strong>Disbursed To Account:</strong> ${safeLoan.disbursementAccount?.accountNumber || 'N/A'}</li>
        </ul>
      </div>
      <p>Your first monthly payment will be automatically deducted from your selected account on the due date. You can also make manual payments through your account dashboard at any time.</p>
      <p>If you have any questions about your loan, please contact our loan support team at loans@northcrestbank.com or call 1-800-NORTHCREST. Our loan specialists are available Monday to Friday, 9AM to 6PM EST.</p>
      <p>Thank you for choosing NorthCrest Bank as your lending partner. We look forward to supporting your financial journey!</p>
      <p>Best regards,<br><strong>The NorthCrest Bank Lending Team</strong></p>
    `;

    const html = this.#getBaseTemplate(content, 'Congratulations! Your Loan Has Been Approved');

    return this.sendEmail({
      to: user.email,
      subject: 'Congratulations! Your Loan Has Been Approved',
      html
    });
  }

  async sendCryptoDepositConfirmationEmail(user, deposit, recipientEmail) {
    const safeDeposit = deposit || {};
    const amountFormatted = safeDeposit.amount != null ? `$${Number(safeDeposit.amount).toFixed(2)}` : '$0.00';
    const cryptoUpper = (safeDeposit.crypto || 'N/A').toUpperCase();
    const network = safeDeposit.network || 'N/A';
    const destinationAccount = safeDeposit.destinationAccount || '';
    const maskedAccount = destinationAccount.length >= 4 ? `****${destinationAccount.substring(destinationAccount.length - 4)}` : '****';
    const transactionId = safeDeposit.transactionId || 'N/A';
    const transactionHash = safeDeposit.transactionHash || 'Pending confirmation';

    const investmentInfo = safeDeposit.investmentDetails ? `
      <li><strong>Investment Category:</strong> ${(safeDeposit.investmentDetails.category || 'N/A').charAt(0).toUpperCase() + (safeDeposit.investmentDetails.category || 'N/A').slice(1)}</li>
      <li><strong>Plan ID:</strong> ${safeDeposit.investmentDetails.planId || 'N/A'}</li>
    ` : '';

    const content = `
      <p>Dear ${user.firstName || ''} ${user.lastName || ''},</p>
      <p>Your crypto deposit of <strong>${amountFormatted}</strong> in <strong>${cryptoUpper}</strong> has been successfully initiated and is currently being processed. We are confirming the details of your deposit below.</p>
      <div class="transaction-details">
        <ul>
          <li><strong>Transaction ID:</strong> ${transactionId}</li>
          <li><strong>Cryptocurrency:</strong> ${cryptoUpper}</li>
          <li><strong>Network:</strong> ${network}</li>
          <li><strong>Amount Deposited:</strong> ${amountFormatted}</li>
          <li><strong>Destination Account:</strong> ${maskedAccount}</li>
          <li><strong>On-chain Transaction Hash:</strong> ${transactionHash}</li>
          ${investmentInfo}
          <li><strong>Initiated Date:</strong> ${new Date().toLocaleString()}</li>
        </ul>
      </div>
      <p>Please note that crypto deposits typically take 1-2 business days to reflect in your account, depending on network confirmations. You will receive another email once your deposit has been fully processed and credited to your account.</p>
      <p>If you made this deposit to fund an investment, your investment will begin its term once the funds are fully credited. If you have any questions about the processing time or need to check the status, please contact our support team at support@northcrestbank.com or call 1-800-NORTHCREST.</p>
      <p>Thank you for choosing NorthCrest Bank for your crypto and investment needs!</p>
      <p>Best regards,<br><strong>The NorthCrest Bank Crypto Team</strong></p>
    `;

    const html = this.#getBaseTemplate(content, 'Your Crypto Deposit Has Been Initiated');

    return this.sendEmail({
      to: recipientEmail,
      subject: 'Your Crypto Deposit Has Been Initiated - NorthCrest Bank',
      html
    });
  }

  async sendTaxRefundConfirmationEmail(user, taxRefund) {
    const content = `
      <p>Dear ${taxRefund.fullName || `${user.firstName} ${user.lastName}`},</p>
      <p>Your IRS tax refund request with NorthCrest Bank has been <strong>SUCCESSFULLY SUBMITTED</strong>. Our team will begin processing your request shortly.</p>
      <div class="transaction-details">
        <ul>
          <li><strong>Request ID:</strong> ${taxRefund.requestId}</li>
          <li><strong>Submitted On:</strong> ${new Date(taxRefund.submittedAt).toLocaleString()}</li>
          <li><strong>Current Status:</strong> ${taxRefund.status}</li>
          <li><strong>Documents Uploaded:</strong> ${taxRefund.documents?.length || 0} document(s)</li>
        </ul>
      </div>
      <p>What happens next:</p>
      <ol>
        <li>Our verification team will review all submitted documents within 3-5 business days</li>
        <li>You will receive email updates as your request progresses</li>
        <li>Once approved, your refund will be processed and deposited to your account</li>
      </ol>
      <p>If you have any questions about your tax refund request, please contact our tax support team at taxsupport@northcrestbank.com or call 1-800-NORTHCREST. Our specialists are available Monday to Friday, 9AM to 6PM EST.</p>
      <p>Thank you for choosing NorthCrest Bank to manage your tax refund!</p>
      <p>Best regards,<br><strong>The NorthCrest Bank Tax Team</strong></p>
    `;

    const html = this.#getBaseTemplate(content, 'Your IRS Tax Refund Request Has Been Submitted');

    return this.sendEmail({
      to: taxRefund.idmeEmail,
      subject: 'Your IRS Tax Refund Request Has Been Submitted',
      html
    });
  }

  async sendFrozenAccountAlert(user, actionType) {
    const content = `
      <p>Dear ${user.firstName} ${user.lastName},</p>
      <p>We noticed an attempted ${actionType} on your NorthCrest Bank account, but it could not be completed because your account is currently <strong>frozen</strong>.</p>
      <div class="alert-warning">
        <p><strong>Important:</strong> If you believe this is an error or need assistance unfreezing your account, please contact our live support team immediately at <a href="mailto:support@northcrestbank.com">support@northcrestbank.com</a> or call <strong>1-800-NORTHCREST</strong>.</p>
      </div>
      <p>Our support team is available 24/7 to help you resolve this issue and restore full access to your account.</p>
      <p>Best regards,<br><strong>The NorthCrest Bank Security Team</strong></p>
    `;

    const html = this.#getBaseTemplate(content, 'Account Frozen - Action Required');

    return this.sendEmail({
      to: user.email,
      subject: 'Account Frozen - Please Contact Support',
      html
    });
  }

  stripHtml(html) {
    return html.replace(/<[^>]*>/g, '');
  }
}

module.exports = new EmailService();
