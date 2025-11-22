import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Ensure environment variables are loaded
dotenv.config();

class EmailService {
  constructor() {
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASSWORD;
    
    console.log('📧 Initializing email service...');
    console.log('EMAIL_USER:', emailUser || '❌ NOT SET');
    console.log('EMAIL_PASSWORD exists:', !!emailPass);
    console.log('EMAIL_PASSWORD length:', emailPass?.length || 0);
    
    if (!emailUser || !emailPass) {
      console.error('❌ CRITICAL: Email credentials missing! Check .env file');
      throw new Error('Email credentials not configured');
    }
    
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass
      }
    });
    
    // Verify connection on startup
    this.verifyConnection();
  }
  
  async verifyConnection() {
    try {
      await this.transporter.verify();
      console.log('✅ Email service ready - SMTP connection verified');
    } catch (error) {
      console.error('❌ Email service error - SMTP connection failed:', error.message);
    }
  }

  async sendOTP(email, otp, name) {
    const mailOptions = {
      from: `"StockMaster" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Password Reset OTP - StockMaster',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .otp-box { background: white; border: 2px dashed #667eea; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; border-radius: 8px; color: #667eea; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Password Reset</h1>
            </div>
            <div class="content">
              <p>Hi ${name},</p>
              <p>You requested to reset your password for your StockMaster account.</p>
              <p>Use the OTP below to reset your password:</p>
              <div class="otp-box">${otp}</div>
              <p><strong>This OTP is valid for ${process.env.OTP_EXPIRE_MINUTES || 10} minutes.</strong></p>
              <p>If you didn't request this, please ignore this email.</p>
              <p>Best regards,<br>StockMaster Team</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      console.log('📤 Attempting to send OTP email to:', email);
      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ OTP email sent successfully!');
      console.log('   → Recipient:', email);
      console.log('   → Message ID:', info.messageId);
      console.log('   → Response:', info.response);
      return true;
    } catch (error) {
      console.error('❌ Email sending failed!');
      console.error('   → Recipient:', email);
      console.error('   → Error:', error.message);
      console.error('   → Code:', error.code);
      if (error.code === 'EAUTH') {
        console.error('   → Authentication failed - check EMAIL_USER and EMAIL_PASSWORD');
      }
      return false;
    }
  }

  async sendVerificationEmail(email, token, name) {
    const mailOptions = {
      from: `"StockMaster" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Verify Your Email - StockMaster',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .token-box { background: white; border: 2px dashed #667eea; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; border-radius: 8px; color: #667eea; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✉️ Verify Your Email</h1>
            </div>
            <div class="content">
              <p>Hi ${name},</p>
              <p>Welcome to StockMaster! To complete your registration, please verify your email address.</p>
              <p>Enter this verification code in the app:</p>
              <div class="token-box">${token}</div>
              <p><strong>This code is valid for 24 hours.</strong></p>
              <p>If you didn't create an account, please ignore this email.</p>
              <p>Best regards,<br>StockMaster Team</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      console.log('📤 Attempting to send verification email to:', email);
      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Verification email sent successfully!');
      console.log('   → Recipient:', email);
      console.log('   → Message ID:', info.messageId);
      return true;
    } catch (error) {
      console.error('❌ Verification email sending failed!');
      console.error('   → Recipient:', email);
      console.error('   → Error:', error.message);
      return false;
    }
  }
}

export default new EmailService();
