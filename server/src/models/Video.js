import mongoose from 'mongoose';

const videoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Video title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    videoId: {
      type: String,
      required: [true, 'YouTube video ID is required'],
      index: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course reference is required'],
    },
    position: {
      type: Number,
      required: true,
      min: 0,
    },
    duration: {
      type: String, // ISO 8601 format (e.g., "PT1H2M3S")
      default: null,
    },
    durationSeconds: {
      type: Number, // Computed for sorting and display
      default: 0,
    },
    thumbnailUrl: {
      type: String,
      default: null,
    },
    // Creator attribution (legal compliance)
    channelTitle: {
      type: String,
      required: [true, 'Channel title is required for attribution'],
    },
    channelId: {
      type: String,
      required: true,
    },
    // Embed permission check (legal compliance)
    isEmbeddable: {
      type: Boolean,
      required: true,
      default: true,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for fast lookups within a course
videoSchema.index({ courseId: 1, position: 1 });
videoSchema.index({ videoId: 1, courseId: 1 });

const Video = mongoose.model('Video', videoSchema);

export default Video;
