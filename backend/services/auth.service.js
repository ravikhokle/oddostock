import crypto from 'crypto';
import User from '../models/User.model.js';
import { AppError } from '../middleware/errorHandler.js';
import emailService from './email.service.js';

class AuthService {
  async register(userData) {
    const { name, email, password, role } = userData;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError('User already exists with this email', 400);
    }

    // Generate 6-digit verification token
    const verificationToken = crypto.randomInt(100000, 999999).toString();

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'warehouse_staff',
      emailVerificationToken: verificationToken,
      emailVerificationExpire: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
    });

    // Send verification email
    const emailSent = await emailService.sendVerificationEmail(email, verificationToken, name);

    if (!emailSent) {
      // Delete user if email fails
      await User.findByIdAndDelete(user._id);
      throw new AppError('Failed to send verification email. Please try again.', 500);
    }

    return {
      message: 'Registration successful! Please check your email to verify your account.',
      email: user.email
    };
  }

  async login(email, password) {
    // Check if user exists
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      throw new AppError('Wrong username or password', 401);
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      throw new AppError('Please verify your email before logging in. Check your inbox for the verification code.', 403);
    }

    // Check if user is active
    if (!user.isActive) {
      throw new AppError('Your account has been deactivated', 403);
    }

    // Verify password
    const isPasswordMatch = await user.matchPassword(password);
    if (!isPasswordMatch) {
      throw new AppError('Wrong username or password', 401);
    }

    // Generate token
    const token = user.getSignedJwtToken();

    return {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    };
  }

  async verifyEmail(email, token) {
    const user = await User.findOne({ 
      email,
      emailVerificationToken: token,
      emailVerificationExpire: { $gt: Date.now() }
    });

    if (!user) {
      throw new AppError('Invalid or expired verification token', 400);
    }

    // Mark email as verified
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save({ validateBeforeSave: false });

    // Generate token for auto-login
    const authToken = user.getSignedJwtToken();

    return {
      message: 'Email verified successfully! You can now log in.',
      token: authToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    };
  }

  async resendVerification(email) {
    const user = await User.findOne({ email });
    
    if (!user) {
      throw new AppError('No user found with this email', 404);
    }

    if (user.isEmailVerified) {
      throw new AppError('Email is already verified', 400);
    }

    // Generate new verification token
    const verificationToken = crypto.randomInt(100000, 999999).toString();
    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    await user.save({ validateBeforeSave: false });

    // Send verification email
    const emailSent = await emailService.sendVerificationEmail(email, verificationToken, user.name);

    if (!emailSent) {
      throw new AppError('Failed to send verification email. Please try again later.', 500);
    }

    return {
      message: 'Verification email sent successfully'
    };
  }

  async forgotPassword(email) {
    const user = await User.findOne({ email });
    if (!user) {
      throw new AppError('No user found with this email', 404);
    }

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();

    // Set OTP and expiry
    user.resetPasswordOTP = otp;
    user.resetPasswordExpire = Date.now() + parseInt(process.env.OTP_EXPIRE_MINUTES || 10) * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    // Send OTP via email
    const emailSent = await emailService.sendOTP(email, otp, user.name);

    if (!emailSent) {
      user.resetPasswordOTP = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      throw new AppError('Email could not be sent. Please try again later.', 500);
    }

    return {
      message: 'OTP sent to your email'
    };
  }

  async resetPassword(email, otp, newPassword) {
    const user = await User.findOne({
      email,
      resetPasswordOTP: otp,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      throw new AppError('Invalid or expired OTP', 400);
    }

    // Update password
    user.password = newPassword;
    user.resetPasswordOTP = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    return {
      message: 'Password reset successful'
    };
  }

  async getProfile(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    return {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt
    };
  }

  async updateProfile(userId, updates) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Only allow updating certain fields
    const allowedUpdates = ['name'];
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        user[key] = updates[key];
      }
    });

    await user.save();

    return {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    };
  }
}

export default new AuthService();
