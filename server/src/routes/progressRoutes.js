import express from 'express';
import {
  getCourseProgress,
  updateCourseProgress,
  getProgressDashboard,
} from '../controllers/progressController.js';
import authenticate from '../middleware/auth.js';

const router = express.Router();

// All progress routes require authentication
router.use(authenticate);

// Aggregated analytics dashboard
router.get('/dashboard', getProgressDashboard);

// Course-specific progress
router.get('/:courseId', getCourseProgress);
router.put('/:courseId', updateCourseProgress);

export default router;
