import Course from '../models/Course.js';
import Video from '../models/Video.js';
import User from '../models/User.js';
import { success, error, ApiError } from '../utils/apiResponse.js';
import { extractPlaylistId, formatDuration } from '../utils/youtubeHelpers.js';
import {
  fetchPlaylistDetails,
  fetchPlaylistItems,
  fetchVideoDetails,
} from '../services/youtubeService.js';

/**
 * POST /api/courses
 * Ingest a YouTube playlist URL → create Course + Video documents.
 *
 * Flow:
 * 1. Extract playlist ID from URL
 * 2. Check if course already exists (re-enroll user if so)
 * 3. Fetch playlist metadata from YouTube API
 * 4. Fetch all playlist items (video IDs)
 * 5. Batch-fetch video details (duration, embed status)
 * 6. Create Course document + bulk-insert Video documents
 * 7. Enroll user in course
 */
export const createCourse = async (req, res, next) => {
  try {
    const { playlistUrl } = req.body;

    if (!playlistUrl) {
      return error(res, 'Playlist URL is required.', 400);
    }

    // 1. Extract playlist ID
    const playlistId = extractPlaylistId(playlistUrl);
    if (!playlistId) {
      return error(
        res,
        'Invalid YouTube playlist URL. Please provide a valid playlist link.',
        400
      );
    }

    // 2. Check if course already exists
    const existingCourse = await Course.findOne({ playlistId });
    if (existingCourse) {
      // Enroll user if not already enrolled
      if (!existingCourse.enrolledUsers.includes(req.userId)) {
        existingCourse.enrolledUsers.push(req.userId);
        await existingCourse.save();
      }

      // Add course to user's enrolled list if not already there
      await User.findByIdAndUpdate(req.userId, {
        $addToSet: { enrolledCourses: existingCourse._id },
      });

      // Return existing course with populated videos
      const populated = await Course.findById(existingCourse._id).populate({
        path: 'videos',
        options: { sort: { position: 1 } },
      });

      return success(res, { course: populated }, 200, 'Enrolled in existing course.');
    }

    // 3. Fetch playlist metadata
    const playlistDetails = await fetchPlaylistDetails(playlistId);

    // 4. Fetch all playlist items
    const playlistItems = await fetchPlaylistItems(playlistId);

    if (playlistItems.length === 0) {
      return error(
        res,
        'This playlist appears to be empty or all videos are private/deleted.',
        404
      );
    }

    // 5. Batch-fetch video details (duration, embed status)
    const videoIds = playlistItems.map((item) => item.videoId);
    const videoDetailsMap = await fetchVideoDetails(videoIds);

    // 6. Create Course document
    const course = await Course.create({
      title: playlistDetails.title,
      description: playlistDetails.description,
      playlistId,
      playlistUrl,
      thumbnailUrl: playlistDetails.thumbnailUrl,
      channelTitle: playlistDetails.channelTitle,
      channelId: playlistDetails.channelId,
      totalVideos: playlistItems.length,
      createdBy: req.userId,
      enrolledUsers: [req.userId],
    });

    // 7. Bulk-insert Video documents
    let totalDurationSeconds = 0;
    const videoDocs = playlistItems.map((item) => {
      const details = videoDetailsMap.get(item.videoId) || {};
      totalDurationSeconds += details.durationSeconds || 0;

      return {
        title: item.title,
        description: item.description,
        videoId: item.videoId,
        courseId: course._id,
        position: item.position,
        duration: details.duration || null,
        durationSeconds: details.durationSeconds || 0,
        thumbnailUrl: item.thumbnailUrl,
        channelTitle: details.channelTitle || item.channelTitle,
        channelId: details.channelId || item.channelId,
        isEmbeddable: details.isEmbeddable !== undefined ? details.isEmbeddable : true,
        publishedAt: details.publishedAt || null,
      };
    });

    const insertedVideos = await Video.insertMany(videoDocs);

    // Update course with video references and total duration
    course.videos = insertedVideos.map((v) => v._id);
    course.totalDurationSeconds = totalDurationSeconds;
    await course.save();

    // Add course to user's enrolled list
    await User.findByIdAndUpdate(req.userId, {
      $addToSet: { enrolledCourses: course._id },
    });

    // Return populated course
    const populated = await Course.findById(course._id).populate({
      path: 'videos',
      options: { sort: { position: 1 } },
    });

    return success(res, { course: populated }, 201, 'Course created successfully.');
  } catch (err) {
    // Handle YouTube API errors gracefully
    if (err.response) {
      const status = err.response.status;
      const ytMessage =
        err.response.data?.error?.message || err.response.data?.message || err.message;

      if (status === 400) {
        console.error('YouTube API 400 error:', ytMessage);
        return error(
          res,
          `YouTube API request failed: ${ytMessage}. Please check your YOUTUBE_API_KEY in .env.`,
          400
        );
      }
      if (status === 404) {
        return error(res, 'Playlist not found. It may be private or deleted.', 404);
      }
      if (status === 403) {
        return error(
          res,
          'YouTube API quota exceeded or access denied. Please try again later.',
          429
        );
      }
    }
    next(err);
  }
};

/**
 * GET /api/courses
 * List all courses the authenticated user is enrolled in.
 */
export const getCourses = async (req, res, next) => {
  try {
    const courses = await Course.find({
      enrolledUsers: req.userId,
      isActive: true,
    })
      .sort({ updatedAt: -1 })
      .select('-videos -enrolledUsers');

    return success(res, { courses });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/courses/:id
 * Get a single course with all populated videos.
 */
export const getCourseById = async (req, res, next) => {
  try {
    const course = await Course.findOne({
      _id: req.params.id,
      isActive: true,
    }).populate({
      path: 'videos',
      options: { sort: { position: 1 } },
    });

    if (!course) {
      return error(res, 'Course not found.', 404);
    }

    // Check if user is enrolled
    const isEnrolled = course.enrolledUsers.includes(req.userId);

    return success(res, { course, isEnrolled });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/courses/:id
 * Soft-delete a course (only by the creator).
 */
export const deleteCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return error(res, 'Course not found.', 404);
    }

    // Only the creator can delete
    if (course.createdBy.toString() !== req.userId.toString()) {
      return error(res, 'Not authorized to delete this course.', 403);
    }

    // Soft delete — mark inactive
    course.isActive = false;
    await course.save();

    // Remove from all enrolled users
    await User.updateMany(
      { enrolledCourses: course._id },
      { $pull: { enrolledCourses: course._id } }
    );

    return success(res, null, 200, 'Course removed successfully.');
  } catch (err) {
    next(err);
  }
};
