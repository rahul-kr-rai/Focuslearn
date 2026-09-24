import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import env from '../config/env.js';
import { success, error } from '../utils/apiResponse.js';
import { sendPasswordResetEmail } from '../services/emailService.js';

/**
 * Generate JWT token for a user.
 */
function generateToken(userId) {
  return jwt.sign({ userId }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
}

/**
 * POST /api/auth/register
 * Create a new user account and return JWT.
 */
export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return error(res, 'Name, email, and password are required.', 400);
    }

    if (password.length < 6) {
      return error(res, 'Password must be at least 6 characters.', 400);
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return error(res, 'An account with this email already exists.', 409);
    }

    // Create user (password is hashed by the pre-save hook)
    const user = await User.create({
      name,
      email,
      passwordHash: password,
    });

    // Generate token
    const token = generateToken(user._id);

    return success(
      res,
      {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
        },
      },
      201,
      'Account created successfully.'
    );
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/login
 * Authenticate user and return JWT.
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return error(res, 'Email and password are required.', 400);
    }

    // Find user and explicitly include passwordHash
    const user = await User.findOne({ email }).select('+passwordHash');

    if (!user) {
      return error(res, 'Invalid email or password.', 401);
    }

    // Compare password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return error(res, 'Invalid email or password.', 401);
    }

    // Generate token
    const token = generateToken(user._id);

    return success(res, {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        studyStreak: user.studyStreak,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/auth/me
 * Get current authenticated user profile.
 */
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).populate('enrolledCourses', 'title thumbnailUrl totalVideos');

    if (!user) {
      return error(res, 'User not found.', 404);
    }

    return success(res, { user });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/forgot-password
 * Send password reset email with secure token.
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      console.warn('⚠️ [Auth:ForgotPassword] Email field missing in request');
      return error(res, 'Email address is required.', 400);
    }

    const normalizedEmail = email.toLowerCase().trim();
    console.log(`🔑 [Auth:ForgotPassword] Processing password reset request for: "${normalizedEmail}"`);

    const user = await User.findOne({ email: normalizedEmail });

    const genericMessage = 'If an account with that email exists, a password reset link has been sent.';

    if (!user) {
      console.warn(`⚠️ [Auth:ForgotPassword] No account found in database with email: "${normalizedEmail}"`);
      // In development mode, give clear feedback so testing is straightforward
      if (env.NODE_ENV !== 'production') {
        return error(
          res,
          `No account found with email "${normalizedEmail}". Please check your registered email.`,
          404
        );
      }
      return success(res, null, 200, genericMessage);
    }

    console.log(`👤 [Auth:ForgotPassword] Account found for ${user.name}. Generating reset token...`);

    // Generate reset token and set expiry
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // Send email
    const emailResult = await sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      token: resetToken,
    });

    if (emailResult && !emailResult.sent && !emailResult.simulated) {
      console.error(`❌ [Auth:ForgotPassword] Delivery failed:`, emailResult.error);
      return error(
        res,
        `Email delivery failed: ${emailResult.error}. Please check your Gmail App Password in server/.env`,
        500
      );
    }

    console.log(`✅ [Auth:ForgotPassword] Password reset email process complete for ${user.email}`);
    return success(
      res,
      { emailSent: true, to: user.email },
      200,
      `Password reset email sent to ${user.email}. Please check your inbox and spam folder.`
    );
  } catch (err) {
    console.error('❌ [Auth:ForgotPassword] Unexpected error:', err);
    next(err);
  }
};

/**
 * GET /api/auth/reset-password/:token
 * Verify if reset token is valid and not expired.
 */
export const verifyResetToken = async (req, res, next) => {
  try {
    const { token } = req.params;

    if (!token) {
      return error(res, 'Reset token is required.', 400);
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return error(res, 'Password reset link is invalid or has expired.', 400);
    }

    return success(
      res,
      { valid: true, email: user.email },
      200,
      'Reset token is valid.'
    );
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/reset-password/:token
 * Reset user password using valid token.
 */
export const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!token) {
      return error(res, 'Reset token is required.', 400);
    }

    if (!password) {
      return error(res, 'New password is required.', 400);
    }

    if (password.length < 6) {
      return error(res, 'Password must be at least 6 characters.', 400);
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return error(res, 'Password reset link is invalid or has expired.', 400);
    }

    // Set new password (will be hashed by pre-save hook)
    user.passwordHash = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    // Generate token for auto-login
    const authToken = generateToken(user._id);

    return success(
      res,
      {
        token: authToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
        },
      },
      200,
      'Password has been reset successfully.'
    );
  } catch (err) {
    next(err);
  }
};
