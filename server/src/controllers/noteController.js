import mongoose from 'mongoose';
import Note from '../models/Note.js';
import Video from '../models/Video.js';
import { success, error } from '../utils/apiResponse.js';

/**
 * Helper to resolve a video document by either MongoDB _id or YouTube videoId string.
 */
const findVideoByIdOrYouTubeId = async (idOrVideoId) => {
  if (!idOrVideoId) return null;
  if (mongoose.Types.ObjectId.isValid(idOrVideoId)) {
    const video = await Video.findById(idOrVideoId);
    if (video) return video;
  }
  return await Video.findOne({ videoId: idOrVideoId });
};

/**
 * POST /api/notes
 * Create a new timestamped note for a video.
 */
export const createNote = async (req, res, next) => {
  try {
    const { videoId, courseId, content, timestamp } = req.body;

    if (!content || !content.trim()) {
      return error(res, 'Note content is required.', 400);
    }

    if (content.length > 5000) {
      return error(res, 'Note cannot exceed 5,000 characters.', 400);
    }

    const video = await findVideoByIdOrYouTubeId(videoId);
    if (!video) {
      return error(res, 'Video not found.', 404);
    }

    const safeTimestamp = Math.max(0, Math.floor(Number(timestamp) || 0));

    const note = await Note.create({
      userId: req.userId,
      videoId: video._id,
      courseId: courseId || video.courseId,
      content: content.trim(),
      timestamp: safeTimestamp,
    });

    return success(res, { note }, 201, 'Note created successfully.');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/notes/:videoId
 * Get all notes for the authenticated user for a specific video, sorted chronologically.
 */
export const getNotesByVideo = async (req, res, next) => {
  try {
    const { videoId } = req.params;

    const video = await findVideoByIdOrYouTubeId(videoId);
    if (!video) {
      return success(res, { notes: [] }, 200, 'Video not found, returning empty notes.');
    }

    const notes = await Note.find({
      userId: req.userId,
      videoId: video._id,
    }).sort({ timestamp: 1, createdAt: 1 });

    return success(res, { notes }, 200, 'Notes retrieved successfully.');
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/notes/:id
 * Update an existing note's content or timestamp.
 */
export const updateNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content, timestamp } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return error(res, 'Invalid note ID.', 400);
    }

    const note = await Note.findOne({ _id: id, userId: req.userId });
    if (!note) {
      return error(res, 'Note not found or unauthorized.', 404);
    }

    if (content !== undefined) {
      if (!content.trim()) {
        return error(res, 'Note content cannot be empty.', 400);
      }
      if (content.length > 5000) {
        return error(res, 'Note cannot exceed 5,000 characters.', 400);
      }
      note.content = content.trim();
    }

    if (timestamp !== undefined) {
      note.timestamp = Math.max(0, Math.floor(Number(timestamp) || 0));
    }

    await note.save();

    return success(res, { note }, 200, 'Note updated successfully.');
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/notes/:id
 * Delete a user's note.
 */
export const deleteNote = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return error(res, 'Invalid note ID.', 400);
    }

    const note = await Note.findOneAndDelete({ _id: id, userId: req.userId });
    if (!note) {
      return error(res, 'Note not found or unauthorized.', 404);
    }

    return success(res, { noteId: id }, 200, 'Note deleted successfully.');
  } catch (err) {
    next(err);
  }
};
