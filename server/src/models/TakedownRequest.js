import mongoose from 'mongoose';

const takedownRequestSchema = new mongoose.Schema(
  {
    requesterName: {
      type: String,
      required: [true, 'Requester name is required'],
      trim: true,
    },
    requesterEmail: {
      type: String,
      required: [true, 'Requester email is required'],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    channelUrl: {
      type: String,
      required: [true, 'Channel URL is required'],
      trim: true,
    },
    playlistUrl: {
      type: String,
      default: null,
      trim: true,
    },
    reason: {
      type: String,
      required: [true, 'Reason for takedown is required'],
      maxlength: [2000, 'Reason cannot exceed 2000 characters'],
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'approved', 'rejected'],
        message: 'Status must be pending, approved, or rejected',
      },
      default: 'pending',
    },
    adminNotes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Index for filtering by status
takedownRequestSchema.index({ status: 1, createdAt: -1 });

const TakedownRequest = mongoose.model('TakedownRequest', takedownRequestSchema);

export default TakedownRequest;
