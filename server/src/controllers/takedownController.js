import TakedownRequest from '../models/TakedownRequest.js';
import Course from '../models/Course.js';
import { extractPlaylistId } from '../utils/youtubeHelpers.js';
import { success, error, ApiError } from '../utils/apiResponse.js';

/**
 * Submit a creator takedown request (Public endpoint).
 * POST /api/takedown
 */
export async function submitTakedownRequest(req, res, next) {
  try {
    const { requesterName, requesterEmail, channelUrl, playlistUrl, reason } = req.body;

    if (!requesterName || !requesterEmail || !channelUrl || !reason) {
      throw new ApiError('Name, email, channel URL, and reason are required', 400);
    }

    const takedown = await TakedownRequest.create({
      requesterName: requesterName.trim(),
      requesterEmail: requesterEmail.trim().toLowerCase(),
      channelUrl: channelUrl.trim(),
      playlistUrl: playlistUrl ? playlistUrl.trim() : null,
      reason: reason.trim(),
      status: 'pending',
    });

    return success(
      res,
      {
        takedown: {
          id: takedown._id,
          requesterName: takedown.requesterName,
          channelUrl: takedown.channelUrl,
          playlistUrl: takedown.playlistUrl,
          status: takedown.status,
          createdAt: takedown.createdAt,
        },
        message:
          'Your takedown request has been received. Our compliance team will review it within 24-48 hours.',
      },
      201
    );
  } catch (err) {
    next(err);
  }
}

/**
 * List all takedown requests (Admin view).
 * GET /api/takedown
 */
export async function getTakedownRequests(req, res, next) {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      query.status = status;
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const [requests, total] = await Promise.all([
      TakedownRequest.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10)),
      TakedownRequest.countDocuments(query),
    ]);

    return success(
      res,
      {
        requests,
        pagination: {
          total,
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          pages: Math.ceil(total / parseInt(limit, 10)),
        },
      },
      200
    );
  } catch (err) {
    next(err);
  }
}

/**
 * Update status of a takedown request (Admin action).
 * PUT /api/takedown/:id
 */
export async function updateTakedownStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      throw new ApiError('Status must be pending, approved, or rejected', 400);
    }

    const takedown = await TakedownRequest.findById(id);
    if (!takedown) {
      throw new ApiError('Takedown request not found', 404);
    }

    takedown.status = status;
    if (adminNotes !== undefined) {
      takedown.adminNotes = adminNotes;
    }

    await takedown.save();

    // If approved, automatically deactivate any matching courses
    let deactivatedCoursesCount = 0;
    if (status === 'approved') {
      const filterConditions = [];

      if (takedown.playlistUrl) {
        const playlistId = extractPlaylistId(takedown.playlistUrl);
        if (playlistId) {
          filterConditions.push({ playlistId });
        }
        filterConditions.push({ playlistUrl: takedown.playlistUrl });
      }

      if (takedown.channelUrl) {
        filterConditions.push({ channelUrl: takedown.channelUrl });
      }

      if (filterConditions.length > 0) {
        const result = await Course.updateMany(
          { $or: filterConditions, isActive: true },
          { isActive: false }
        );
        deactivatedCoursesCount = result.modifiedCount || 0;
      }
    }

    return success(
      res,
      {
        takedown,
        deactivatedCoursesCount,
        message: `Takedown request updated to ${status}.${
          deactivatedCoursesCount > 0
            ? ` ${deactivatedCoursesCount} course(s) deactivated.`
            : ''
        }`,
      },
      200
    );
  } catch (err) {
    next(err);
  }
}
