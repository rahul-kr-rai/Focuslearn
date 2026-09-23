import express from 'express';
import {
  submitTakedownRequest,
  getTakedownRequests,
  updateTakedownStatus,
} from '../controllers/takedownController.js';
import auth from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Public submission route (rate limited to prevent spam)
router.post('/', authLimiter, submitTakedownRequest);

// Management / Review routes (authenticated)
router.get('/', auth, getTakedownRequests);
router.put('/:id', auth, updateTakedownStatus);

export default router;
