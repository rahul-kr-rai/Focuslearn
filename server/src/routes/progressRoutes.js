import express from 'express';
import {
  getCourseProgress,
  updateCourseProgress,
  getProgressDashboard,
  resetDemoProgressHandler,
} from '../controllers/progressController.js';
import authenticate from '../middleware/auth.js';

const router = express.Router();

// All progress routes require authentication
router.use(authenticate);

// Aggregated analytics dashboard
router.get('/dashboard', getProgressDashboard);

// On-demand reset of demo user progress
router.post('/reset-demo', resetDemoProgressHandler);

// Course-specific progress
router.get('/:courseId', getCourseProgress);
router.put('/:courseId', updateCourseProgress);

export default router;
