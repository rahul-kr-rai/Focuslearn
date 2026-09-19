import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import env from '../config/env.js';
import { success, error } from '../utils/apiResponse.js';

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
