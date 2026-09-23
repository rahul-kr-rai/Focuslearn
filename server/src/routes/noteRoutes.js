import express from 'express';
import {
  createNote,
  getNotesByVideo,
  updateNote,
  deleteNote,
} from '../controllers/noteController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All note routes require authentication
router.use(authenticate);

// Create a timestamped note
router.post('/', createNote);

// Get all notes for a specific video
router.get('/:videoId', getNotesByVideo);

// Update a specific note
router.put('/:id', updateNote);

// Delete a specific note
router.delete('/:id', deleteNote);

export default router;
