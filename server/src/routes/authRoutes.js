import { Router } from 'express';
import { register, login, getMe } from '../controllers/authController.js';
import auth from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Public routes (with stricter rate limiting)
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);

// Protected route
router.get('/me', auth, getMe);

export default router;
