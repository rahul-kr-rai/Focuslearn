import mongoose from 'mongoose';
import Quiz from '../models/Quiz.js';
import Video from '../models/Video.js';
import Course from '../models/Course.js';
import Progress from '../models/Progress.js';
import QuizAttempt from '../models/QuizAttempt.js';
import User from '../models/User.js';
import geminiService from '../services/geminiService.js';
import { success, error, ApiError } from '../utils/apiResponse.js';

/**
 * Helper to update user study streak based on last study date.
 */
async function updateUserStreak(userId) {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (user.lastStudyDate) {
      const last = new Date(user.lastStudyDate);
      const lastDate = new Date(last.getFullYear(), last.getMonth(), last.getDate());
      const diffDays = Math.round((today - lastDate) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        user.studyStreak = (user.studyStreak || 0) + 1;
        user.lastStudyDate = now;
        await user.save();
      } else if (diffDays > 1) {
        user.studyStreak = 1;
        user.lastStudyDate = now;
        await user.save();
      } else if (diffDays === 0) {
        user.lastStudyDate = now;
        await user.save();
      }
    } else {
      user.studyStreak = 1;
      user.lastStudyDate = now;
      await user.save();
    }
  } catch (err) {
    console.error('Streak update error from quiz:', err);
  }
}

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
 * Get existing quiz for a video and all past attempts by current user.
 */
export const getQuizByVideo = async (req, res, next) => {
  try {
    const { videoId } = req.params;
    const userId = req.userId || req.user?._id;

    const video = await findVideoByIdOrYouTubeId(videoId);
    if (!video) {
      return error(res, 'Video not found.', 404);
    }

    const quiz = await Quiz.findOne({ videoId: video._id });
    if (!quiz) {
      return success(
        res,
        {
          quiz: null,
          pastAttempt: null,
          attempts: [],
          latestAttempt: null,
          bestAttempt: null,
          totalAttempts: 0,
        },
        200,
        'No quiz has been generated for this video yet.'
      );
    }

    // Fetch all attempts for this user on this quiz
    const attempts = await QuizAttempt.find({
      userId,
      quizId: quiz._id,
    }).sort({ attemptNumber: -1 });

    const totalAttempts = attempts.length;
    const latestAttempt = attempts.length > 0 ? attempts[0] : null;

    let bestAttempt = null;
    if (attempts.length > 0) {
      bestAttempt = [...attempts].sort((a, b) => b.score - a.score || a.timeTakenSeconds - b.timeTakenSeconds)[0];
    }

    // Legacy pastAttempt format for backward compatibility
    let pastAttempt = null;
    if (latestAttempt) {
      pastAttempt = {
        score: latestAttempt.score,
        total: latestAttempt.total,
        percentage: latestAttempt.percentage,
        completedAt: latestAttempt.completedAt,
        timeTakenSeconds: latestAttempt.timeTakenSeconds,
        attemptNumber: latestAttempt.attemptNumber,
      };
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
        attempts,
        latestAttempt,
        bestAttempt,
        totalAttempts,
      },
      200,
      'Quiz and attempt history retrieved successfully.'
    );
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/quizzes/:quizId/submit
 * Submit answers for evaluation, record a distinct QuizAttempt, update Progress, and return detailed review.
 * Body: { answers: [...], timeTakenSeconds: Number }
 */
export const submitQuiz = async (req, res, next) => {
  try {
    const { quizId } = req.params;
    const { answers, timeTakenSeconds = 0 } = req.body;
    const userId = req.userId || req.user?._id;

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
        const item = answers[idx];
        if (typeof item === 'object' && item !== null) {
          selectedOption = item.selectedOption ?? item.answer;
        } else {
          selectedOption = item;
        }
      } else if (typeof answers === 'object') {
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
        explanation: q.explanation || '',
      };
    });

    const percentage = Math.round((score / total) * 100);
    const passed = percentage >= 60;
    const cleanTimeTaken = Math.max(0, parseInt(timeTakenSeconds, 10) || 0);

    // Count existing attempts for this user & quiz to determine attempt number
    const previousAttemptsCount = await QuizAttempt.countDocuments({
      userId,
      quizId: quiz._id,
    });
    const attemptNumber = previousAttemptsCount + 1;

    // Fetch previous attempt if exists to compute improvement
    const previousAttempt = await QuizAttempt.findOne({
      userId,
      quizId: quiz._id,
      attemptNumber: previousAttemptsCount,
    });

    // Check if this is the highest score so far
    const highestPrevious = await QuizAttempt.findOne({
      userId,
      quizId: quiz._id,
    }).sort({ score: -1 });

    const isNewBest = !highestPrevious || score > highestPrevious.score;
    const improvementDelta = previousAttempt ? percentage - previousAttempt.percentage : 0;

    // Save detailed QuizAttempt document
    const attempt = await QuizAttempt.create({
      userId,
      quizId: quiz._id,
      videoId: quiz.videoId,
      courseId: quiz.courseId,
      attemptNumber,
      score,
      total,
      percentage,
      passed,
      timeTakenSeconds: cleanTimeTaken,
      answers: results,
      completedAt: new Date(),
    });

    // Update Progress model with best score achieved
    let progress = await Progress.findOne({
      userId,
      courseId: quiz.courseId,
    });

    if (!progress) {
      progress = new Progress({
        userId,
        courseId: quiz.courseId,
        completedVideos: [],
        quizScores: [],
      });
    }

    const existingIndex = progress.quizScores.findIndex(
      (qs) => qs.quizId.toString() === quiz._id.toString()
    );

    if (existingIndex >= 0) {
      // Store the higher score or update timestamp
      if (score >= progress.quizScores[existingIndex].score) {
        progress.quizScores[existingIndex].score = score;
        progress.quizScores[existingIndex].total = total;
      }
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

    // Update user streak on quiz completion
    await updateUserStreak(userId);

    // Fetch all attempts for this quiz to return comprehensive list
    const allAttempts = await QuizAttempt.find({
      userId,
      quizId: quiz._id,
    }).sort({ attemptNumber: -1 });

    return success(
      res,
      {
        attemptId: attempt._id,
        attemptNumber,
        score,
        total,
        percentage,
        passed,
        timeTakenSeconds: cleanTimeTaken,
        completedAt: attempt.completedAt,
        improvementDelta,
        isNewBest,
        results,
        allAttempts,
      },
      200,
      'Quiz evaluated successfully!'
    );
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/quizzes/:quizId/attempts
 * Get all attempts for a specific quiz by current user.
 */
export const getQuizAttempts = async (req, res, next) => {
  try {
    const { quizId } = req.params;
    const userId = req.userId || req.user?._id;

    const attempts = await QuizAttempt.find({
      userId,
      quizId,
    }).sort({ attemptNumber: -1 });

    return success(
      res,
      {
        attempts,
        totalAttempts: attempts.length,
      },
      200,
      'Quiz attempts retrieved successfully.'
    );
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/quizzes/attempts/:attemptId
 * Get a specific attempt's full question details and results.
 */
export const getAttemptDetails = async (req, res, next) => {
  try {
    const { attemptId } = req.params;
    const userId = req.userId || req.user?._id;

    const attempt = await QuizAttempt.findOne({
      _id: attemptId,
      userId,
    })
      .populate('courseId', 'title thumbnailUrl playlistUrl')
      .populate('videoId', 'title videoId duration durationSeconds position');

    if (!attempt) {
      return error(res, 'Attempt record not found.', 404);
    }

    // Also fetch summary of all attempts for this same quiz
    const allAttempts = await QuizAttempt.find({
      quizId: attempt.quizId,
      userId,
    })
      .select('_id attemptNumber score total percentage passed timeTakenSeconds completedAt')
      .sort({ attemptNumber: -1 });

    return success(
      res,
      { attempt, allAttempts },
      200,
      'Attempt details retrieved successfully.'
    );
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/quizzes/user/overview
 * Get overall quiz performance metrics across all courses and quizzes for the logged in user.
 */
export const getUserQuizOverview = async (req, res, next) => {
  try {
    const userId = req.userId || req.user?._id;

    // Fetch all user attempts populated with course and video info
    const attempts = await QuizAttempt.find({ userId })
      .populate('courseId', 'title thumbnailUrl')
      .populate('videoId', 'title videoId duration')
      .sort({ createdAt: -1 });

    if (attempts.length === 0) {
      return success(
        res,
        {
          totalAttempts: 0,
          uniqueQuizzesAttempted: 0,
          overallAveragePercentage: 0,
          overallPassRate: 0,
          totalPassed: 0,
          totalPerfectScores: 0,
          totalTimeTakenSeconds: 0,
          averageTimeTakenSeconds: 0,
          recentAttempts: [],
        },
        200,
        'No quiz attempts recorded yet.'
      );
    }

    const uniqueQuizIds = new Set(attempts.map((a) => a.quizId.toString()));
    const totalAttempts = attempts.length;
    const totalScore = attempts.reduce((acc, a) => acc + a.score, 0);
    const totalPossible = attempts.reduce((acc, a) => acc + a.total, 0);
    const overallAveragePercentage =
      totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0;

    const passedCount = attempts.filter((a) => a.passed).length;
    const overallPassRate = Math.round((passedCount / totalAttempts) * 100);
    const perfectCount = attempts.filter((a) => a.score === a.total).length;
    const totalTimeTakenSeconds = attempts.reduce((acc, a) => acc + (a.timeTakenSeconds || 0), 0);
    const averageTimeTakenSeconds = Math.round(totalTimeTakenSeconds / totalAttempts);

    // Latest 20 attempts for review
    const recentAttempts = attempts.slice(0, 20);

    return success(
      res,
      {
        totalAttempts,
        uniqueQuizzesAttempted: uniqueQuizIds.size,
        overallAveragePercentage,
        overallPassRate,
        totalPassed: passedCount,
        totalPerfectScores: perfectCount,
        totalTimeTakenSeconds,
        averageTimeTakenSeconds,
        recentAttempts,
      },
      200,
      'User quiz performance overview retrieved.'
    );
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/quizzes/course/:courseId
 * Get all quizzes available in a course, student's attempt records, and overall course quiz performance.
 */
export const getCourseQuizzes = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const userId = req.userId || req.user?._id;

    const course = await Course.findById(courseId).populate(
      'videos',
      'title videoId position duration durationSeconds isEmbeddable'
    );
    if (!course) {
      return error(res, 'Course not found.', 404);
    }

    // Get all quizzes generated for this course
    const quizzes = await Quiz.find({ courseId: course._id });
    const quizMapByVideoId = new Map();
    quizzes.forEach((q) => {
      quizMapByVideoId.set(q.videoId.toString(), q);
    });

    // Get all attempts by this user for this course
    const attempts = await QuizAttempt.find({ courseId: course._id, userId })
      .populate('videoId', 'title videoId position duration durationSeconds')
      .sort({ createdAt: -1 });

    // Group attempts by videoId
    const attemptsByVideoId = new Map();
    attempts.forEach((att) => {
      const vidKey = att.videoId?._id?.toString() || att.videoId?.toString();
      if (!attemptsByVideoId.has(vidKey)) {
        attemptsByVideoId.set(vidKey, []);
      }
      attemptsByVideoId.get(vidKey).push(att);
    });

    // Map each lesson/video in course with its quiz and student attempts
    const lessonsWithQuiz = (course.videos || []).map((video, index) => {
      const vidIdStr = video._id.toString();
      const quiz = quizMapByVideoId.get(vidIdStr) || null;
      const vidAttempts = attemptsByVideoId.get(vidIdStr) || [];

      const latestAttempt = vidAttempts.length > 0 ? vidAttempts[0] : null;
      const bestAttempt =
        vidAttempts.length > 0
          ? [...vidAttempts].sort(
              (a, b) => b.score - a.score || a.timeTakenSeconds - b.timeTakenSeconds
            )[0]
          : null;

      return {
        video: {
          _id: video._id,
          title: video.title,
          videoId: video.videoId,
          position: video.position !== undefined ? video.position : index + 1,
          duration: video.duration,
          durationSeconds: video.durationSeconds,
          isEmbeddable: video.isEmbeddable,
        },
        hasQuiz: Boolean(quiz),
        quizId: quiz?._id || null,
        totalQuestions: quiz?.questions?.length || 0,
        attemptsCount: vidAttempts.length,
        bestAttempt: bestAttempt
          ? {
              _id: bestAttempt._id,
              attemptNumber: bestAttempt.attemptNumber,
              score: bestAttempt.score,
              total: bestAttempt.total,
              percentage: bestAttempt.percentage,
              passed: bestAttempt.passed,
              timeTakenSeconds: bestAttempt.timeTakenSeconds,
              completedAt: bestAttempt.completedAt,
            }
          : null,
        latestAttempt: latestAttempt
          ? {
              _id: latestAttempt._id,
              attemptNumber: latestAttempt.attemptNumber,
              score: latestAttempt.score,
              total: latestAttempt.total,
              percentage: latestAttempt.percentage,
              passed: latestAttempt.passed,
              timeTakenSeconds: latestAttempt.timeTakenSeconds,
              completedAt: latestAttempt.completedAt,
            }
          : null,
      };
    });

    // Course quiz aggregate metrics
    const totalLessons = course.videos?.length || 0;
    const totalQuizzesGenerated = quizzes.length;
    const distinctAttemptedVideoIds = new Set(
      attempts.map((a) => a.videoId?._id?.toString() || a.videoId?.toString())
    );
    const totalQuizzesAttempted = distinctAttemptedVideoIds.size;
    const totalAttemptsCount = attempts.length;

    const passedAttemptsCount = attempts.filter((a) => a.passed).length;
    const passRate =
      totalAttemptsCount > 0 ? Math.round((passedAttemptsCount / totalAttemptsCount) * 100) : 0;

    let sumBestPercentages = 0;
    let attemptedLessonsCount = 0;
    lessonsWithQuiz.forEach((l) => {
      if (l.bestAttempt) {
        sumBestPercentages += l.bestAttempt.percentage;
        attemptedLessonsCount += 1;
      }
    });

    const overallCourseQuizAverage =
      attemptedLessonsCount > 0
        ? Math.round(sumBestPercentages / attemptedLessonsCount)
        : 0;

    const totalTimeSeconds = attempts.reduce(
      (acc, a) => acc + (a.timeTakenSeconds || 0),
      0
    );
    const averageTimeSeconds =
      totalAttemptsCount > 0 ? Math.round(totalTimeSeconds / totalAttemptsCount) : 0;
    const perfectScoresCount = attempts.filter((a) => a.score === a.total).length;

    return success(
      res,
      {
        course: {
          _id: course._id,
          title: course.title,
          channelTitle: course.channelTitle,
          thumbnailUrl: course.thumbnailUrl,
          playlistUrl: course.playlistUrl,
          totalVideos: totalLessons,
        },
        stats: {
          totalLessons,
          totalQuizzesGenerated,
          totalQuizzesAttempted,
          totalAttemptsCount,
          overallCourseQuizAverage,
          passRate,
          passedAttemptsCount,
          perfectScoresCount,
          totalTimeSeconds,
          averageTimeSeconds,
        },
        lessons: lessonsWithQuiz,
        attempts,
      },
      200,
      'Course quizzes and attempt records retrieved successfully.'
    );
  } catch (err) {
    next(err);
  }
};
