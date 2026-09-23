# Implementation Plan — Phase 4: Progress Tracking, Analytics & Takedown Portal

Phase 4 completes the FocusLearn LMS experience by introducing end-to-end user progress persistence, an analytics dashboard with streak tracking & goal setting, course resume capabilities, and a creator takedown portal with legal compliance workflows.

---

## User Review Required

> [!IMPORTANT]
> - **Progress Synchronization**: `StudyPage.jsx` will automatically record video completion, save playback timestamps, sync study time, and auto-update user study streaks when lessons are completed.
> - **Takedown Workflow**: The takedown endpoint is public for creators to request removal of their content. If an admin approves a takedown, the corresponding course can automatically be deactivated (`isActive: false`).

---

## Proposed Changes

### Backend

#### [NEW] `server/src/controllers/progressController.js`
- `getCourseProgress`: Fetch or initialize progress for the authenticated user and course ID (populating completed videos and current video).
- `updateCourseProgress`: Update completed video list, current video position (`currentVideoId`, `currentTimestamp`), add/increment `studyTimeMinutes`, update `goalHoursPerWeek`. Automatically recalculates `completionPercent` based on total course videos and updates the user's `studyStreak` and `lastStudyDate`.
- `getProgressDashboard`: Aggregate comprehensive analytics for the authenticated user:
  - Total enrolled courses, completed courses, and in-progress courses
  - Overall platform completion percentage
  - Total accumulated study time in minutes and formatted string (hours + minutes)
  - Current study streak (consecutive days) and streak status (active today / streak maintained)
  - Total quizzes completed and overall average quiz score percentage
  - Weekly goal progress (actual study time vs user target hours)
  - Detailed list of all enrolled courses with completion %, completed/total videos count, quiz score averages, and last accessed timestamp

#### [NEW] `server/src/routes/progressRoutes.js`
- Mount JWT authentication middleware on all routes:
  - `GET /api/progress/dashboard` → `getProgressDashboard`
  - `GET /api/progress/:courseId` → `getCourseProgress`
  - `PUT /api/progress/:courseId` → `updateCourseProgress`

#### [NEW] `server/src/controllers/takedownController.js`
- `submitTakedownRequest`: Public endpoint validating requester name, email, channel URL, optional playlist URL, and reason. Creates a new `TakedownRequest` record with status `pending`.
- `getTakedownRequests`: List takedown requests (supports filter by status: pending, approved, rejected).
- `updateTakedownStatus`: Update request status and admin notes. If approved, search for matching courses by playlist URL or channel URL and set `isActive = false`.

#### [NEW] `server/src/routes/takedownRoutes.js`
- `POST /api/takedown` (public submission, rate-limited)
- `GET /api/takedown` (administrative listing)
- `PUT /api/takedown/:id` (administrative status update)

#### [MODIFY] `server/src/app.js`
- Import and mount `progressRoutes` at `/api/progress` and `takedownRoutes` at `/api/takedown`.

---

### Frontend

#### [MODIFY] `client/src/services/api.js`
- Verify and expand `progressAPI` and `takedownAPI` methods:
  - `progressAPI.getByCourse(courseId)`
  - `progressAPI.update(courseId, data)`
  - `progressAPI.getDashboard()`
  - `takedownAPI.submit(data)`
  - `takedownAPI.getAll(params)`
  - `takedownAPI.updateStatus(id, data)`

#### [NEW] `client/src/pages/ProgressPage.jsx`
- **Analytics & Progress Hub**:
  - Top summary cards: Total Study Time, Active Streak with fire glow, Overall Completion Rate, Quiz Average Score.
  - Interactive Weekly Study Goal widget (adjustable goal slider/input with live visual meter & progress percentage).
  - Study Streak calendar/tracker with activity badges and motivation milestones.
  - Course-by-course progress breakdown with completion progress bars, quiz averages, and one-click "Continue Learning" button that jumps directly to the user's last watched video.
  - Quiz performance breakdown card showing accuracy and recent quiz results.

#### [NEW] `client/src/pages/TakedownPage.jsx`
- **Creator Takedown Portal**:
  - Legal compliance overview explaining YouTube API compliance, streaming-only nature, and 24-48h takedown SLA.
  - Interactive submission form with validation for Creator/Representative Name, Contact Email, YouTube Channel URL, Course/Playlist URL, Reason, and Legal Confirmation Checkbox.
  - Success submission confirmation with ticket reference and next steps.
  - Built-in administrative request manager tab for easy testing and reviewing submitted requests.

#### [MODIFY] `client/src/pages/DashboardPage.jsx`
- Replace hardcoded stats with dynamic stats fetched from `/api/progress/dashboard`.
- Display real progress bars and completion percentages on enrolled course cards.
- Add quick navigation to the full `/progress` Analytics Hub.

#### [MODIFY] `client/src/pages/StudyPage.jsx`
- Load saved course progress on mount: restore `currentVideoId` and resume `currentTimestamp` where the user left off.
- On video end or manual toggle, call `progressAPI.update()` to mark video completed in DB.
- Track study session duration and sync time spent in intervals to keep user streak and study minutes accurate.
- Pass real completed video IDs down to `ModuleList.jsx`.

#### [MODIFY] `client/src/components/layout/Navbar.jsx`
- Add "Analytics" link to navigation menu when authenticated.

#### [MODIFY] `client/src/App.jsx`
- Register `/progress` route (protected) and `/takedown` route (public).

---

## Verification Plan

### Automated Verification
- Run Node check on server files to verify syntax: `node --check server/src/app.js`, `node --check server/src/controllers/progressController.js`, etc.
- Build client bundle with `npm run build` in `client/` to verify zero JSX or bundle errors.

### Manual Verification
- Test `GET /api/progress/dashboard` and verify structured response.
- Test `POST /api/takedown` with test data and check created document.
- Verify Study page resumes last played video and correctly saves video completion.
- Verify Progress Page displays streak, stats, goal tracker, and course breakdown.
