# FocusLearn — Phase Progress Tracker

> **Purpose**: This file tracks completed tasks and current state so that any AI model can quickly understand the project status without scanning the entire codebase.

---

## Project Overview
- **Stack**: MongoDB + Mongoose, Express.js, React (Vite + Tailwind CSS v4), Node.js
- **External APIs**: YouTube Data API v3, YouTube IFrame Player API, Google Gemini API
- **Workspace**: `d:\Project\Focuslearn\`

---

## Current Phase: Phase 3 — AI Quiz Generation & Notes Module
**Status**: ✅ Completed

### Completed (Phase 3)
- Gemini AI service (`geminiService.js`) using `@google/genai` (structured JSON schema, error handling, model fallback)
- Quiz controller (`quizController.js`) with AI generation, video lookup by ObjectId or YouTube ID, caching, and score grading
- Quiz routes (`quizRoutes.js`) mounted at `/api/quizzes` with JWT auth and AI rate limiter (10 req/15 min)
- Automatic user `Progress` synchronization on quiz submission (records score, total, percentage, timestamp)
- Notes controller (`noteController.js`) with full CRUD (create, read, update, delete) and timestamp validation
- Notes routes (`noteRoutes.js`) mounted at `/api/notes` with JWT auth
- Formatting utilities (`formatters.js`) for `formatTime` (MM:SS) and `formatRelativeTime`
- Markdown viewer (`MarkdownViewer.jsx`) for syntax-highlighted notes rendering (headings, bold, italic, code blocks, lists, timestamp tags)
- Note editor (`NoteEditor.jsx`) with live player timestamp synchronization, markdown toolbar, preview mode, and keyboard shortcuts
- Note list (`NoteList.jsx`) with clickable timestamp chips (instant video seek), search filter, edit/delete actions, and Markdown file export / copy
- AI Quiz panel (`QuizPanel.jsx`) with 4 distinct states: Prompt/Generate, AI thinking shimmer, Interactive MCQ taking with question jumper, and Result breakdown with AI explanations
- Player control integration in `YouTubePlayer.jsx` (exposing `seekTo`, `getCurrentTime`, `play`, `pause`)
- Upgraded `StudyPage.jsx` with tabbed workspace: Notes, AI Quiz, and Lesson Overview
- Verified: All database operations, Gemini AI calls, and Vite client build succeeded with 0 errors

### Next Phase
- **Phase 4**: Progress Tracking, Analytics & Takedown Portal

---

## Phase Summary

| Phase | Description | Status |
|---|---|---|
| 1 | Backend Architecture, Database Schema & Legal Guardrails | ✅ Completed |
| 2 | YouTube Playlist Parser & Distraction-Free LMS UI | ✅ Completed |
| 3 | AI Quiz Generation & Notes Module | ✅ Completed |
| 4 | Progress Tracking, Analytics & Takedown Portal | ⬜ Not Started |


---

## Key Design Decisions
1. **Auth**: Email/password with JWT (no OAuth for MVP)
2. **Tailwind CSS v4**: Using `@tailwindcss/vite` plugin, no config file needed
3. **Dark mode**: Default theme with slate/blue/cyan palette
4. **Embed checks**: Two-step YouTube API process (playlistItems → videos.list for status.embeddable)
5. **Gemini SDK**: Using `@google/genai` (new SDK, not legacy `@google/generative-ai`)
6. **Architecture**: Model-Service-Controller pattern with thin controllers
7. **CSS @import order**: Google Fonts import must precede @import "tailwindcss" in CSS
8. **CSS Cascade Layers**: All base element resets (`*`, `body`, `a`, `html`) must reside in `@layer base` so Tailwind utilities (`@layer utilities`) like `text-white` aren't overridden by unlayered selectors.
9. **Input Icon Padding**: Used mutually exclusive padding `${Icon ? 'pl-10 pr-4' : 'px-4'}` to avoid `px-4` overriding `pl-10`.

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
- `package.json` — Dependencies: express, mongoose, bcryptjs, jsonwebtoken, axios, @google/genai, etc.
- `server.js` — Entry point, connects DB, starts Express
- `src/app.js` — Express config with CORS, Helmet, Morgan, rate limiter, routes
- `src/config/db.js` — Mongoose connection with retry logic
- `src/config/env.js` — Centralized env loading with validation
- `src/models/User.js` — User schema with bcrypt pre-save hook
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
- `src/controllers/authController.js` — register, login, getMe
- `src/routes/authRoutes.js` — POST /register, POST /login, GET /me

### Client (`client/`)
- `vite.config.js` — React + Tailwind v4 plugins, /api proxy to :5000
- `index.html` — SEO meta tags, Google Fonts preconnect
- `src/index.css` — Tailwind v4 + @theme design tokens + base styles + animations
- `src/main.jsx` — App entry with StrictMode
- `src/App.jsx` — BrowserRouter, AuthProvider, protected/public routes, 404
- `src/context/AuthContext.jsx` — Auth state, login/register/logout, JWT persistence
- `src/services/api.js` — Axios instance with JWT interceptor + API helpers
- `src/components/ui/Button.jsx` — 5 variants, 3 sizes, loading, icon slot
- `src/components/ui/Input.jsx` — Label, icon, error, forwarded ref
- `src/components/ui/Card.jsx` — Glassmorphism, hover lift, glow
- `src/components/ui/Loader.jsx` — Full-page and inline modes
- `src/components/ui/Modal.jsx` — Backdrop blur, Escape close, body scroll lock
- `src/components/layout/Navbar.jsx` — Glassmorphism, auth-aware, mobile menu
- `src/components/layout/Footer.jsx` — Brand, links, legal disclaimer, YouTube ToS
- `src/components/layout/LegalDisclaimer.jsx` — Compact/full modes, takedown link
- `src/pages/HomePage.jsx` — Hero, 6 features grid, how-it-works, legal
- `src/pages/DashboardPage.jsx` — Stats grid, course grid, import playlist modal
- `src/pages/LoginPage.jsx` — Form validation, auth context
- `src/pages/RegisterPage.jsx` — Form validation, password confirm
- `src/pages/CoursePage.jsx` — Course detail with video list, channel attribution, stats
- `src/pages/StudyPage.jsx` — Split-panel: YouTube player + module sidebar, auto-advance

### Hooks (`client/src/hooks/`)
- `useYouTubePlayer.js` — YouTube IFrame Player API hook (load, init, play/pause/seek)

### Course Components (`client/src/components/course/`)
- `CourseCard.jsx` — Dashboard course card with thumbnail, play overlay, stats
- `ModuleList.jsx` — Sidebar video list with progress bar, active/completed states
- `CreatorAttribution.jsx` — Channel name, avatar, "Watch on YouTube" link

### Player Components (`client/src/components/player/`)
- `YouTubePlayer.jsx` — Distraction-free YouTube IFrame embed wrapper
