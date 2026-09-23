import Progress from '../models/Progress.js';
import Course from '../models/Course.js';
import Video from '../models/Video.js';
import User from '../models/User.js';
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
        // Studied consecutive day
        user.studyStreak = (user.studyStreak || 0) + 1;
        user.lastStudyDate = now;
        await user.save();
      } else if (diffDays > 1) {
        // Streak broken, reset to 1
        user.studyStreak = 1;
        user.lastStudyDate = now;
        await user.save();
      } else if (diffDays === 0) {
        // Already recorded today, keep same streak but update timestamp
        user.lastStudyDate = now;
        await user.save();
      }
    } else {
      // First time studying
      user.studyStreak = 1;
      user.lastStudyDate = now;
      await user.save();
    }
  } catch (err) {
    console.error('Streak update error:', err);
  }
}

/**
 * Get progress for a specific course.
 * GET /api/progress/:courseId
 */
export async function getCourseProgress(req, res, next) {
  try {
    const { courseId } = req.params;
    const userId = req.user._id;

    // Verify course exists
    const course = await Course.findById(courseId).select('title totalVideos videos');
    if (!course) {
      throw new ApiError('Course not found', 404);
    }

    // Find or create progress record
    let progress = await Progress.findOne({ userId, courseId })
      .populate('completedVideos', 'title videoId position duration durationSeconds')
      .populate('currentVideoId', 'title videoId position duration durationSeconds');

    if (!progress) {
      progress = await Progress.create({
        userId,
        courseId,
        completedVideos: [],
        quizScores: [],
        currentVideoId: course.videos?.[0] || null,
        currentTimestamp: 0,
        completionPercent: 0,
        studyTimeMinutes: 0,
      });

      progress = await Progress.findById(progress._id)
        .populate('completedVideos', 'title videoId position duration durationSeconds')
        .populate('currentVideoId', 'title videoId position duration durationSeconds');
    }

    return success(res, { progress }, 200);
  } catch (err) {
    next(err);
  }
}

/**
 * Update course progress (complete/uncomplete video, save playback position, record study minutes).
 * PUT /api/progress/:courseId
 */
export async function updateCourseProgress(req, res, next) {
  try {
    const { courseId } = req.params;
    const userId = req.user._id;
    const {
      completedVideoId,
      unmarkVideoId,
      completedVideoIds,
      currentVideoId,
      currentTimestamp,
      studyTimeMinutes,
      goalHoursPerWeek,
    } = req.body;

    const course = await Course.findById(courseId).select('videos totalVideos');
    if (!course) {
      throw new ApiError('Course not found', 404);
    }

    let progress = await Progress.findOne({ userId, courseId });
    if (!progress) {
      progress = new Progress({
        userId,
        courseId,
        completedVideos: [],
        quizScores: [],
      });
    }

    // Handle marking a single video as completed (accepts MongoDB ObjectId or YouTube videoId)
    if (completedVideoId) {
      let resolvedVideoId = completedVideoId;
      if (typeof completedVideoId === 'string' && completedVideoId.length !== 24) {
        const vidDoc = await Video.findOne({ videoId: completedVideoId, courseId });
        if (vidDoc) resolvedVideoId = vidDoc._id;
      }

      if (resolvedVideoId && !progress.completedVideos.some((id) => id.toString() === resolvedVideoId.toString())) {
        progress.completedVideos.push(resolvedVideoId);
      }
    }

    // Handle unmarking a single video
    if (unmarkVideoId) {
      let resolvedUnmarkId = unmarkVideoId;
      if (typeof unmarkVideoId === 'string' && unmarkVideoId.length !== 24) {
        const vidDoc = await Video.findOne({ videoId: unmarkVideoId, courseId });
        if (vidDoc) resolvedUnmarkId = vidDoc._id;
      }

      if (resolvedUnmarkId) {
        progress.completedVideos = progress.completedVideos.filter(
          (id) => id.toString() !== resolvedUnmarkId.toString()
        );
      }
    }

    // Handle replacing whole completedVideos array
    if (Array.isArray(completedVideoIds)) {
      // Resolve any YouTube IDs in array
      const resolvedArray = [];
      for (const item of completedVideoIds) {
        if (typeof item === 'string' && item.length !== 24) {
          const v = await Video.findOne({ videoId: item, courseId });
          if (v) resolvedArray.push(v._id);
        } else {
          resolvedArray.push(item);
        }
      }
      progress.completedVideos = resolvedArray;
    }

    // Handle current video position
    if (currentVideoId) {
      let resolvedCurrentId = currentVideoId;
      if (typeof currentVideoId === 'string' && currentVideoId.length !== 24) {
        const vidDoc = await Video.findOne({ videoId: currentVideoId, courseId });
        if (vidDoc) resolvedCurrentId = vidDoc._id;
      }
      progress.currentVideoId = resolvedCurrentId;
    }

    if (typeof currentTimestamp === 'number' && currentTimestamp >= 0) {
      progress.currentTimestamp = Math.floor(currentTimestamp);
    }

    // Increment study time if provided
    if (typeof studyTimeMinutes === 'number' && studyTimeMinutes > 0) {
      progress.studyTimeMinutes = (progress.studyTimeMinutes || 0) + studyTimeMinutes;
    }

    // Update weekly study goal if provided
    if (typeof goalHoursPerWeek === 'number' && goalHoursPerWeek >= 0) {
      progress.goalHoursPerWeek = goalHoursPerWeek;
    }

    // Recalculate completion percent
    const totalVids = course.videos?.length || course.totalVideos || 1;
    progress.completionPercent = Math.min(
      100,
      Math.round((progress.completedVideos.length / totalVids) * 100)
    );

    await progress.save();

    // Trigger streak calculation
    await updateUserStreak(userId);

    const populated = await Progress.findById(progress._id)
      .populate('completedVideos', 'title videoId position duration durationSeconds')
      .populate('currentVideoId', 'title videoId position duration durationSeconds');

    return success(res, { progress: populated }, 200);
  } catch (err) {
    next(err);
  }
}

/**
 * Get aggregate progress & analytics across all user courses.
 * GET /api/progress/dashboard
 */
export async function getProgressDashboard(req, res, next) {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).select('name email studyStreak lastStudyDate enrolledCourses');
    if (!user) {
      throw new ApiError('User not found', 404);
    }

    // Fetch all courses enrolled by user
    const courses = await Course.find({
      _id: { $in: user.enrolledCourses || [] },
      isActive: true,
    }).populate('videos', 'title videoId position duration durationSeconds');

    // Fetch all progress records for user
    const progressList = await Progress.find({ userId })
      .populate('completedVideos', 'title videoId position duration durationSeconds')
      .populate('currentVideoId', 'title videoId position duration durationSeconds');

    // Map progress by courseId
    const progressMap = new Map();
    progressList.forEach((p) => {
      progressMap.set(p.courseId.toString(), p);
    });

    let totalVideosAcrossCourses = 0;
    let totalCompletedVideos = 0;
    let totalStudyTimeMinutes = 0;
    let completedCoursesCount = 0;
    let inProgressCoursesCount = 0;
    let notStartedCoursesCount = 0;
    let totalQuizzesTaken = 0;
    let totalQuizScoreSum = 0;
    let totalQuizMaxSum = 0;

    const courseBreakdown = courses.map((course) => {
      const p = progressMap.get(course._id.toString());
      const totalVids = course.videos?.length || course.totalVideos || 0;
      const completedVids = p ? p.completedVideos.length : 0;
      const completionPercent = totalVids > 0 ? Math.min(100, Math.round((completedVids / totalVids) * 100)) : 0;
      const studyTime = p ? p.studyTimeMinutes || 0 : 0;

      totalVideosAcrossCourses += totalVids;
      totalCompletedVideos += completedVids;
      totalStudyTimeMinutes += studyTime;

      if (completionPercent === 100) {
        completedCoursesCount++;
      } else if (completionPercent > 0) {
        inProgressCoursesCount++;
      } else {
        notStartedCoursesCount++;
      }

      // Quiz stats for this course
      let courseQuizzesTaken = 0;
      let courseQuizAvg = 0;
      if (p?.quizScores && p.quizScores.length > 0) {
        courseQuizzesTaken = p.quizScores.length;
        totalQuizzesTaken += courseQuizzesTaken;
        const sumScores = p.quizScores.reduce((acc, q) => acc + q.score, 0);
        const sumTotals = p.quizScores.reduce((acc, q) => acc + q.total, 0);
        totalQuizScoreSum += sumScores;
        totalQuizMaxSum += sumTotals;
        courseQuizAvg = sumTotals > 0 ? Math.round((sumScores / sumTotals) * 100) : 0;
      }

      return {
        courseId: course._id,
        title: course.title,
        thumbnailUrl: course.thumbnailUrl,
        channelTitle: course.channelTitle,
        totalVideos: totalVids,
        completedVideosCount: completedVids,
        completionPercent,
        studyTimeMinutes: studyTime,
        currentVideo: p?.currentVideoId || (course.videos && course.videos[0]) || null,
        currentTimestamp: p?.currentTimestamp || 0,
        quizzesTaken: courseQuizzesTaken,
        quizAverageScore: courseQuizAvg,
        lastUpdated: p?.updatedAt || course.createdAt,
      };
    });

    const overallCompletionPercent =
      totalVideosAcrossCourses > 0
        ? Math.round((totalCompletedVideos / totalVideosAcrossCourses) * 100)
        : 0;

    const overallQuizAverage =
      totalQuizMaxSum > 0 ? Math.round((totalQuizScoreSum / totalQuizMaxSum) * 100) : 0;

    // Check if streak is still active today
    let isStreakActiveToday = false;
    if (user.lastStudyDate) {
      const now = new Date();
      const last = new Date(user.lastStudyDate);
      isStreakActiveToday =
        now.getFullYear() === last.getFullYear() &&
        now.getMonth() === last.getMonth() &&
        now.getDate() === last.getDate();
    }

    return success(
      res,
      {
        analytics: {
          totalCourses: courses.length,
          completedCourses: completedCoursesCount,
          inProgressCourses: inProgressCoursesCount,
          notStartedCourses: notStartedCoursesCount,
          totalVideos: totalVideosAcrossCourses,
          completedVideos: totalCompletedVideos,
          overallCompletionPercent,
          totalStudyTimeMinutes,
          studyStreak: user.studyStreak || 0,
          isStreakActiveToday,
          lastStudyDate: user.lastStudyDate,
          totalQuizzesTaken,
          overallQuizAverage,
          courses: courseBreakdown,
        },
      },
      200
    );
  } catch (err) {
    next(err);
  }
}
