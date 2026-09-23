import mongoose from 'mongoose';
import Quiz from '../models/Quiz.js';
import Video from '../models/Video.js';
import Progress from '../models/Progress.js';
import geminiService from '../services/geminiService.js';
import { success, error, ApiError } from '../utils/apiResponse.js';

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
 * POST /api/quizzes/generate/:videoId
 * Generate a new quiz (or fetch existing cached quiz) for a video using Gemini AI.
 * Query params: ?regenerate=true (to force generating a new quiz)
 */
export const generateQuiz = async (req, res, next) => {
  try {
    const { videoId } = req.params;
    const { regenerate } = req.query;

    const video = await findVideoByIdOrYouTubeId(videoId);
    if (!video) {
      return error(res, 'Video not found.', 404);
    }

    // Check if quiz already exists
    let existingQuiz = await Quiz.findOne({ videoId: video._id });

    if (existingQuiz && regenerate !== 'true') {
      const sanitizedQuestions = existingQuiz.questions.map((q, idx) => ({
        _id: q._id,
        questionIndex: idx,
        question: q.question,
        options: q.options,
      }));

      return success(
        res,
        {
          quiz: {
            _id: existingQuiz._id,
            videoId: video.videoId,
            videoMongoId: video._id,
            courseId: existingQuiz.courseId,
            questions: sanitizedQuestions,
            totalQuestions: sanitizedQuestions.length,
            generatedBy: existingQuiz.generatedBy,
            createdAt: existingQuiz.createdAt,
          },
        },
        200,
        'Existing quiz retrieved.'
      );
    }

    // Generate questions using Gemini AI
    const rawQuestions = await geminiService.generateQuizQuestions(
      video.title,
      video.description,
      5
    );

    let savedQuiz;
    if (existingQuiz) {
      existingQuiz.questions = rawQuestions;
      existingQuiz.generatedBy = 'gemini';
      savedQuiz = await existingQuiz.save();
    } else {
      savedQuiz = await Quiz.create({
        videoId: video._id,
        courseId: video.courseId,
        questions: rawQuestions,
        generatedBy: 'gemini',
      });
    }

    const sanitizedQuestions = savedQuiz.questions.map((q, idx) => ({
      _id: q._id,
      questionIndex: idx,
      question: q.question,
      options: q.options,
    }));

    return success(
      res,
      {
        quiz: {
          _id: savedQuiz._id,
          videoId: video.videoId,
          videoMongoId: video._id,
          courseId: savedQuiz.courseId,
          questions: sanitizedQuestions,
          totalQuestions: sanitizedQuestions.length,
          generatedBy: savedQuiz.generatedBy,
          createdAt: savedQuiz.createdAt,
        },
      },
      201,
      'AI Quiz generated successfully!'
    );
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/quizzes/:videoId
 * Get existing quiz for a video and any past attempt by current user.
 */
export const getQuizByVideo = async (req, res, next) => {
  try {
    const { videoId } = req.params;

    const video = await findVideoByIdOrYouTubeId(videoId);
    if (!video) {
      return error(res, 'Video not found.', 404);
    }

    const quiz = await Quiz.findOne({ videoId: video._id });
    if (!quiz) {
      return success(
        res,
        { quiz: null, pastAttempt: null },
        200,
        'No quiz has been generated for this video yet.'
      );
    }

    // Check user's past attempt in Progress
    const progress = await Progress.findOne({
      userId: req.userId,
      courseId: quiz.courseId,
    });

    let pastAttempt = null;
    if (progress && progress.quizScores?.length > 0) {
      const existingScore = progress.quizScores.find(
        (qs) => qs.quizId.toString() === quiz._id.toString()
      );
      if (existingScore) {
        pastAttempt = {
          score: existingScore.score,
          total: existingScore.total,
          percentage: Math.round((existingScore.score / existingScore.total) * 100),
          completedAt: existingScore.completedAt,
        };
      }
    }

    const sanitizedQuestions = quiz.questions.map((q, idx) => ({
      _id: q._id,
      questionIndex: idx,
      question: q.question,
      options: q.options,
    }));

    return success(
      res,
      {
        quiz: {
          _id: quiz._id,
          videoId: video.videoId,
          videoMongoId: video._id,
          courseId: quiz.courseId,
          questions: sanitizedQuestions,
          totalQuestions: sanitizedQuestions.length,
          generatedBy: quiz.generatedBy,
          createdAt: quiz.createdAt,
        },
        pastAttempt,
      },
      200,
      'Quiz retrieved successfully.'
    );
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/quizzes/:quizId/submit
 * Submit answers for evaluation, update Progress model, and return detailed review.
 * Body: { answers: [selectedOptionIndex, ...] } or { answers: { [questionId or index]: selectedOptionIndex } }
 */
export const submitQuiz = async (req, res, next) => {
  try {
    const { quizId } = req.params;
    const { answers } = req.body;

    if (!answers) {
      return error(res, 'Answers payload is required.', 400);
    }

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return error(res, 'Quiz not found.', 404);
    }

    // Evaluate answers
    let score = 0;
    const total = quiz.questions.length;

    const results = quiz.questions.map((q, idx) => {
      let selectedOption = null;

      if (Array.isArray(answers)) {
        // Can be array of numbers [0, 2, 1] or array of objects [{ questionIndex: 0, selectedOption: 1 }]
        const item = answers[idx];
        if (typeof item === 'object' && item !== null) {
          selectedOption = item.selectedOption ?? item.answer;
        } else {
          selectedOption = item;
        }
      } else if (typeof answers === 'object') {
        // Object keyed by index or subdocument _id
        selectedOption = answers[q._id.toString()] ?? answers[idx] ?? answers[String(idx)];
      }

      selectedOption = selectedOption !== undefined && selectedOption !== null ? Number(selectedOption) : -1;
      const isCorrect = selectedOption === q.correctAnswer;

      if (isCorrect) {
        score += 1;
      }

      return {
        questionId: q._id,
        questionIndex: idx,
        question: q.question,
        options: q.options,
        selectedOption,
        correctAnswer: q.correctAnswer,
        isCorrect,
        explanation: q.explanation,
      };
    });

    const percentage = Math.round((score / total) * 100);
    const passed = percentage >= 60;

    // Update or insert into user's Progress record
    let progress = await Progress.findOne({
      userId: req.userId,
      courseId: quiz.courseId,
    });

    if (!progress) {
      progress = new Progress({
        userId: req.userId,
        courseId: quiz.courseId,
        completedVideos: [],
        quizScores: [],
      });
    }

    // Check if score already exists for this quiz
    const existingIndex = progress.quizScores.findIndex(
      (qs) => qs.quizId.toString() === quiz._id.toString()
    );

    if (existingIndex >= 0) {
      progress.quizScores[existingIndex].score = score;
      progress.quizScores[existingIndex].total = total;
      progress.quizScores[existingIndex].completedAt = new Date();
    } else {
      progress.quizScores.push({
        quizId: quiz._id,
        score,
        total,
        completedAt: new Date(),
      });
    }

    await progress.save();

    return success(
      res,
      {
        quizId: quiz._id,
        score,
        total,
        percentage,
        passed,
        results,
      },
      200,
      'Quiz evaluated successfully!'
    );
  } catch (err) {
    next(err);
  }
};
