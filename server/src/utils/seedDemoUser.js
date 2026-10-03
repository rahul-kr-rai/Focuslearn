import User from '../models/User.js';
import Course from '../models/Course.js';
import Progress from '../models/Progress.js';
import Note from '../models/Note.js';
import QuizAttempt from '../models/QuizAttempt.js';

export const DEMO_USER = {
  name: 'Demo User',
  email: 'demo@gmail.com',
  password: 'Demo@123',
};

/**
 * Resets the demo user's progress to a completely clean slate (0% completion, 0 streak, 0 minutes).
 * This ensures any recruiter, reviewer, or tester experiences the app fresh without leftover progress.
 */
export async function resetDemoUserProgress(userId) {
  try {
    const user = userId ? await User.findById(userId) : await User.findOne({ email: DEMO_USER.email });
    if (!user) return;

    // Reset user streak and study stats to 0
    user.studyStreak = 0;
    user.lastStudyDate = null;
    await user.save();

    const courses = await Course.find({ isActive: true });
    const courseIds = courses.map((c) => c._id);

    // Ensure enrolled courses are attached
    user.enrolledCourses = courseIds;
    await user.save();

    // Ensure user is in course.enrolledUsers so course queries list them
    for (const course of courses) {
      if (!course.enrolledUsers?.some((id) => id.toString() === user._id.toString())) {
        course.enrolledUsers = course.enrolledUsers || [];
        course.enrolledUsers.push(user._id);
        await course.save();
      }
    }

    // Reset all progress documents for the demo user to clean 0% state
    await Progress.deleteMany({ userId: user._id });

    for (const course of courses) {
      await Progress.create({
        userId: user._id,
        courseId: course._id,
        completedVideos: [],
        completionPercent: 0,
        currentVideoId: null,
        studyTimeMinutes: 0,
        goalHoursPerWeek: 5,
        quizScores: [],
      });
    }

    // Clear any past demo notes or quiz attempts
    await Note.deleteMany({ userId: user._id });
    await QuizAttempt.deleteMany({ userId: user._id });

    console.log(`✨ [Seed] Demo account reset to clean slate (0% progress, 0 streak): ${DEMO_USER.email}`);
  } catch (error) {
    console.warn('⚠️ [Seed] Could not reset demo user progress:', error.message);
  }
}

/**
 * Ensures demo user exists in the database with enrolled courses and a fresh 0-progress starting state.
 */
export async function seedDemoUser() {
  try {
    let user = await User.findOne({ email: DEMO_USER.email });
    const courses = await Course.find({ isActive: true });
    const courseIds = courses.map((c) => c._id);

    if (!user) {
      user = await User.create({
        name: DEMO_USER.name,
        email: DEMO_USER.email,
        passwordHash: DEMO_USER.password,
        enrolledCourses: courseIds,
        studyStreak: 0,
        lastStudyDate: null,
      });
      console.log(`✨ [Seed] Demo account created: ${DEMO_USER.email}`);
    }

    // Reset progress to clean slate on seed
    await resetDemoUserProgress(user._id);
  } catch (error) {
    console.warn('⚠️ [Seed] Could not ensure demo user:', error.message);
  }
}
