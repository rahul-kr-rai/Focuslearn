# FocusLearn — Phase Progress Tracker

> **Purpose**: This file tracks completed tasks and current state so that any AI model can quickly understand the project status without scanning the entire codebase.

---

## Project Overview
- **Stack**: MongoDB + Mongoose, Express.js, React (Vite + Tailwind CSS v4), Node.js
- **External APIs**: YouTube Data API v3, YouTube IFrame Player API, Google Gemini API
- **Workspace**: `d:\Project\Focuslearn\`

---

## Current Phase: Phase 4 — Progress Tracking, Analytics & Takedown Portal
**Status**: ✅ Completed

### Completed (Phase 4)
- Progress controller (`progressController.js`) with course progress CRUD, streak auto-update algorithm, and dashboard aggregation
- Progress routes (`progressRoutes.js`) mounted at `/api/progress` with JWT authentication
- Takedown controller (`takedownController.js`) for public creator requests, queue listing, status review, and automatic course deactivation on approval
- Takedown routes (`takedownRoutes.js`) mounted at `/api/takedown`
- Circular progress completion ring (`CompletionRing.jsx`) with dynamic gradient animation
- Streak tracker (`StreakTracker.jsx`) with 7-day week calendar activity indicator, fire glow, and milestone badges
- Weekly goal setter (`GoalSetter.jsx`) with interactive range slider, live progress bar, and remaining hours calculation
- Course progress breakdown card (`CourseProgressCard.jsx`) with progress bar, quiz average badge, and direct lesson resume
- Analytics & Progress Hub page (`ProgressPage.jsx`) featuring top summary metrics, goal tracker, completion breakdown, and course breakdown
- Creator Takedown Portal page (`TakedownPage.jsx`) with public legal removal form, validation, reference tickets, and built-in Admin review queue
- Updated `DashboardPage.jsx` with real dynamic analytics, streak badges, progress bars, and direct link to Analytics Hub
- Upgraded `StudyPage.jsx` with session restoration (last played video and timestamp seek), mark-completed toggle, auto-advance, and background study heartbeat
- Navbar (`Navbar.jsx`) updated with Analytics and Takedown Portal links
- App routing (`App.jsx`) configured with `/progress` (protected) and `/takedown` (public)
- Client production bundle verified: 0 errors with Vite

---

## Phase Summary

| Phase | Description | Status |
|---|---|---|
| 1 | Backend Architecture, Database Schema & Legal Guardrails | ✅ Completed |
| 2 | YouTube Playlist Parser & Distraction-Free LMS UI | ✅ Completed |
| 3 | AI Quiz Generation & Notes Module | ✅ Completed |
| 4 | Progress Tracking, Analytics & Takedown Portal | ✅ Completed |

---

## Key Design Decisions
1. **Auth**: Email/password with JWT (no OAuth for MVP)
2. **Tailwind CSS v4**: Using `@tailwindcss/vite` plugin, no config file needed
3. **Dark mode**: Default theme with slate/blue/cyan palette
4. **Embed checks**: Two-step YouTube API process (playlistItems → videos.list for status.embeddable)
5. **Gemini SDK**: Using `@google/genai` (new SDK, not legacy `@google/generative-ai`)
6. **Architecture**: Model-Service-Controller pattern with thin controllers
7. **Progress Persistence**: Compound index on (userId, courseId) in MongoDB, automatic streak recalculation on active study dates.
8. **Takedown Workflow**: Public submission + admin review queue with automatic deactivation of matching courses upon approval.

---

## Environment Variables Required
```
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=<random-string>
YOUTUBE_API_KEY=<from-google-cloud-console>
GEMINI_API_KEY=<from-google-ai-studio>
CLIENT_URL=http://localhost:5173
```

---

## File Manifest

### Server (`server/`)
- `server.js` — Entry point, connects DB, starts Express
- `src/app.js` — Express config with CORS, Helmet, Morgan, rate limiter, mounted routes
- `src/config/db.js` — Mongoose connection with retry logic
- `src/config/env.js` — Centralized env loading with validation
- `src/models/User.js` — User schema with bcrypt pre-save hook and streak tracking
- `src/models/Course.js` — Course with playlist ID, creator attribution, isActive flag
- `src/models/Video.js` — Video with isEmbeddable boolean, position ordering
- `src/models/Quiz.js` — Quiz with embedded question subdocuments (4-option MCQ)
- `src/models/Note.js` — Timestamped notes per video per user
- `src/models/Progress.js` — Progress with unique compound index (userId+courseId)
- `src/models/TakedownRequest.js` — Takedown requests with status workflow
- `src/middleware/auth.js` — JWT Bearer token verification
- `src/middleware/errorHandler.js` — Global error handler (Mongoose, JWT, custom)
- `src/middleware/rateLimiter.js` — General (100/15min), auth (20/15min), AI (10/15min)
- `src/utils/youtubeHelpers.js` — extractPlaylistId, parseDuration, formatDuration, formatTimestamp
- `src/utils/apiResponse.js` — success/error response helpers + ApiError class
- `src/services/youtubeService.js` — fetchPlaylistDetails, fetchPlaylistItems, fetchVideoDetails
- `src/services/geminiService.js` — Google Gemini AI quiz generation
- `src/controllers/authController.js` — register, login, getMe
- `src/controllers/courseController.js` — ingestPlaylist, getCourses, getCourseById, deleteCourse
- `src/controllers/quizController.js` — generateQuiz, getQuiz, submitQuiz
- `src/controllers/noteController.js` — createNote, getNotesByVideo, updateNote, deleteNote
- `src/controllers/progressController.js` — getCourseProgress, updateCourseProgress, getProgressDashboard
- `src/controllers/takedownController.js` — submitTakedownRequest, getTakedownRequests, updateTakedownStatus
- `src/routes/authRoutes.js` — POST /register, POST /login, GET /me
- `src/routes/courseRoutes.js` — POST /, GET /, GET /:id, DELETE /:id
- `src/routes/quizRoutes.js` — POST /generate/:videoId, GET /:videoId, POST /:quizId/submit
- `src/routes/noteRoutes.js` — POST /, GET /:videoId, PUT /:id, DELETE /:id
- `src/routes/progressRoutes.js` — GET /dashboard, GET /:courseId, PUT /:courseId
- `src/routes/takedownRoutes.js` — POST /, GET /, PUT /:id

### Client (`client/`)
- `vite.config.js` — React + Tailwind v4 plugins, /api proxy to :5000
- `index.html` — SEO meta tags, Google Fonts preconnect
- `src/index.css` — Tailwind v4 + @theme design tokens + base styles + animations
- `src/main.jsx` — App entry with StrictMode
- `src/App.jsx` — BrowserRouter, AuthProvider, protected/public routes, 404
- `src/context/AuthContext.jsx` — Auth state, login/register/logout, JWT persistence
- `src/services/api.js` — Axios instance with JWT interceptor + API helpers
- `src/components/ui/` — Button, Input, Card, Loader, Modal
- `src/components/layout/` — Navbar, Footer, LegalDisclaimer
- `src/components/player/` — YouTubePlayer (IFrame wrapper with seek/time controls)
- `src/components/course/` — CourseCard, ModuleList, CreatorAttribution
- `src/components/quiz/` — QuizPanel (AI MCQ with question jumper & explanations)
- `src/components/notes/` — NoteEditor, NoteList, MarkdownViewer
- `src/components/progress/` — CompletionRing, StreakTracker, GoalSetter, CourseProgressCard
- `src/pages/HomePage.jsx` — Landing hero, feature highlights, how it works
- `src/pages/DashboardPage.jsx` — Dynamic stats grid, course cards with progress, import modal
- `src/pages/ProgressPage.jsx` — Learning Analytics & Progress Hub
- `src/pages/TakedownPage.jsx` — Creator Takedown Portal & Admin review queue
- `src/pages/LoginPage.jsx` — Auth login form
- `src/pages/RegisterPage.jsx` — Registration form
- `src/pages/CoursePage.jsx` — Course overview, modules list, channel attribution
- `src/pages/StudyPage.jsx` — Distraction-free LMS workspace with Notes, Quiz, and live Progress persistence
