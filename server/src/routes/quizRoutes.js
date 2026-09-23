import express from 'express';
import {
  generateQuiz,
  getQuizByVideo,
  submitQuiz,
} from '../controllers/quizController.js';
import { authenticate } from '../middleware/auth.js';
import { aiLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// All quiz routes require authentication
router.use(authenticate);

// Generate or fetch cached quiz with AI rate limiting
router.post('/generate/:videoId', aiLimiter, generateQuiz);

// Get quiz and past attempt for a specific video
router.get('/:videoId', getQuizByVideo);

// Submit answers and record score
router.post('/:quizId/submit', submitQuiz);

export default router;
