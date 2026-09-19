import mongoose from 'mongoose';

// Subdocument schema for individual quiz questions
const questionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: [true, 'Question text is required'],
    },
    options: {
      type: [String],
      required: true,
      validate: {
        validator: function (arr) {
          return arr.length === 4;
        },
        message: 'Each question must have exactly 4 options',
      },
    },
    correctAnswer: {
      type: Number,
      required: true,
      min: 0,
      max: 3,
    },
    explanation: {
      type: String,
      default: '',
    },
  },
  { _id: true }
);

const quizSchema = new mongoose.Schema(
  {
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
    questions: {
      type: [questionSchema],
      required: true,
      validate: {
        validator: function (arr) {
          return arr.length >= 1 && arr.length <= 10;
        },
        message: 'Quiz must have between 1 and 10 questions',
      },
    },
    generatedBy: {
      type: String,
      enum: ['gemini', 'manual'],
      default: 'gemini',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index: one quiz per video
quizSchema.index({ videoId: 1, courseId: 1 });

const Quiz = mongoose.model('Quiz', quizSchema);

export default Quiz;
