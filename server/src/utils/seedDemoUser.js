import User from '../models/User.js';
import Course from '../models/Course.js';
import Progress from '../models/Progress.js';
import Video from '../models/Video.js';

export const DEMO_USER = {
  name: 'Demo User',
  email: 'demo@gmail.com',
  password: 'Demo@123',
};

/**
 * Ensures demo user exists in the database with enrolled courses and realistic progress
 * so recruiters and hiring managers can explore the app immediately.
 */
export async function seedDemoUser() {
  try {
    let user = await User.findOne({ email: DEMO_USER.email });
    const courses = await Course.find();
    const courseIds = courses.map((c) => c._id);

    if (!user) {
      user = await User.create({
        name: DEMO_USER.name,
        email: DEMO_USER.email,
        passwordHash: DEMO_USER.password,
        enrolledCourses: courseIds,
        studyStreak: 5,
        lastStudyDate: new Date(),
      });
      console.log(`✨ [Seed] Demo account created: ${DEMO_USER.email}`);
    } else {
      // Ensure enrolled courses are attached
      if (!user.enrolledCourses || user.enrolledCourses.length === 0) {
        user.enrolledCourses = courseIds;
        user.studyStreak = user.studyStreak || 5;
        await user.save();
      }
    }

    // Ensure progress records exist for enrolled courses
    for (const course of courses) {
      const existingProgress = await Progress.findOne({
        userId: user._id,
        courseId: course._id,
      });

      if (!existingProgress) {
        const videos = await Video.find({ courseId: course._id }).limit(3);
        const videoIds = videos.map((v) => v._id);
        const total = course.totalVideos || 10;
        const completionPercent = Math.min(
          100,
          Math.max(15, Math.round((videoIds.length / total) * 100))
        );

        await Progress.create({
          userId: user._id,
          courseId: course._id,
          completedVideos: videoIds,
          completionPercent,
          currentVideoId: videoIds[0] || null,
          studyTimeMinutes: 120 + Math.floor(Math.random() * 60),
          goalHoursPerWeek: 5,
        });
      }
    }
  } catch (error) {
    console.warn('⚠️ [Seed] Could not ensure demo user:', error.message);
  }
}
