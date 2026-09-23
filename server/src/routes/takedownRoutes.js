import express from 'express';
import {
  submitTakedownRequest,
  getTakedownRequests,
  updateTakedownStatus,
} from '../controllers/takedownController.js';

const router = express.Router();

// Public submission route
router.post('/', submitTakedownRequest);

// Management / Admin routes
router.get('/', getTakedownRequests);
router.put('/:id', updateTakedownStatus);

export default router;
