import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Course title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    playlistId: {
      type: String,
      required: [true, 'Playlist ID is required'],
      unique: true,
      index: true,
    },
    playlistUrl: {
      type: String,
      required: [true, 'Playlist URL is required'],
    },
    thumbnailUrl: {
      type: String,
      default: null,
    },
    // Creator attribution fields (legal compliance)
    channelTitle: {
      type: String,
      required: [true, 'Channel title is required for attribution'],
    },
    channelId: {
      type: String,
      required: [true, 'Channel ID is required'],
    },
    channelUrl: {
      type: String,
      get: function () {
        return `https://www.youtube.com/channel/${this.channelId}`;
      },
    },
    totalVideos: {
      type: Number,
      default: 0,
    },
    totalDurationSeconds: {
      type: Number,
      default: 0,
    },
    videos: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Video',
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    enrolledUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    isActive: {
      type: Boolean,
      default: true, // Set to false when takedown is approved
    },
  },
  {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true },
  }
);

// Index for fast lookups
courseSchema.index({ createdBy: 1 });
courseSchema.index({ isActive: 1 });

const Course = mongoose.model('Course', courseSchema);

export default Course;
