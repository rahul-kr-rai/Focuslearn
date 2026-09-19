import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },
    videoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Video',
      required: [true, 'Video reference is required'],
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course reference is required'],
    },
    content: {
      type: String,
      required: [true, 'Note content is required'],
      maxlength: [5000, 'Note cannot exceed 5000 characters'],
    },
    timestamp: {
      type: Number, // Video timestamp in seconds
      required: [true, 'Video timestamp is required'],
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for fetching user's notes for a video, sorted by timestamp
noteSchema.index({ userId: 1, videoId: 1, timestamp: 1 });

const Note = mongoose.model('Note', noteSchema);

export default Note;
