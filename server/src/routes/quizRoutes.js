import express from 'express';
import {
  generateQuiz,
  getQuizByVideo,
  submitQuiz,
  getQuizAttempts,
  getAttemptDetails,
  getUserQuizOverview,
  getCourseQuizzes,
} from '../controllers/quizController.js';
import { authenticate } from '../middleware/auth.js';
import { aiLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// All quiz routes require authentication
router.use(authenticate);

// Overall user quiz performance analytics
router.get('/user/overview', getUserQuizOverview);

// Course-specific quizzes and student attempts overview
router.get('/course/:courseId', getCourseQuizzes);

// Get single attempt details by attempt ID
router.get('/attempts/:attemptId', getAttemptDetails);

// Get all attempts for a specific quiz ID
router.get('/:quizId/attempts', getQuizAttempts);

// Generate or fetch cached quiz with AI rate limiting
router.post('/generate/:videoId', aiLimiter, generateQuiz);

// Get quiz and past attempts for a specific video
router.get('/:videoId', getQuizByVideo);

// Submit answers and record score
router.post('/:quizId/submit', submitQuiz);

export default router;
