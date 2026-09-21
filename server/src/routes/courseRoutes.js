import { Router } from 'express';
import {
  createCourse,
  getCourses,
  getCourseById,
  deleteCourse,
} from '../controllers/courseController.js';
import auth from '../middleware/auth.js';

const router = Router();

// All course routes require authentication
router.use(auth);

// POST /api/courses — Ingest playlist URL → create Course
router.post('/', createCourse);

// GET /api/courses — List user's enrolled courses
router.get('/', getCourses);

// GET /api/courses/:id — Get course with populated videos
router.get('/:id', getCourseById);

// DELETE /api/courses/:id — Soft-delete course (creator only)
router.delete('/:id', deleteCourse);

export default router;
