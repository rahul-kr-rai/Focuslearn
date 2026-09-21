# FocusLearn — Phase Progress Tracker

> **Purpose**: This file tracks completed tasks and current state so that any AI model can quickly understand the project status without scanning the entire codebase.

---

## Project Overview
- **Stack**: MongoDB + Mongoose, Express.js, React (Vite + Tailwind CSS v4), Node.js
- **External APIs**: YouTube Data API v3, YouTube IFrame Player API, Google Gemini API
- **Workspace**: `d:\Project\Focuslearn\`

---

## Current Phase: Phase 2 — YouTube Playlist Parser & Distraction-Free LMS UI
**Status**: ✅ Completed

### Completed
- Server scaffolding (package.json, server.js, app.js, config)
- All 7 Mongoose models (User, Course, Video, Quiz, Note, Progress, TakedownRequest)
- Middleware (JWT auth, error handler, 3-tier rate limiter)
- Utilities (YouTube URL parser, ISO 8601 duration converter, API response wrapper)
- YouTube Data API v3 service (playlist fetch, embed permission check)
- Auth routes (register, login, getMe) with JWT
- Frontend Vite+React scaffolding with Tailwind CSS v4
- Design system (dark mode, glassmorphism, animations)
- Layout components (Navbar, Footer, LegalDisclaimer)
- UI primitives (Button, Input, Card, Loader, Modal)
- Pages (HomePage, LoginPage, RegisterPage, DashboardPage)
- Auth context with JWT persistence
- API service with Axios interceptors
- Client-side routing with protected/public route wrappers
- Verified: Vite dev server runs with zero console errors
- Course controller (create/ingest, getAll, getById, softDelete)
- Course routes mounted at /api/courses with auth middleware
- Full playlist ingestion flow (extract ID → fetch metadata → fetch items → batch video details → embed check → create Course + Videos)
- YouTube IFrame Player API hook (useYouTubePlayer.js)
- YouTube player component (distraction-free: no annotations, rel=0, modestbranding)
- CourseCard component (thumbnail, play overlay, channel attribution, stats)
- ModuleList sidebar (video list with active/completed states, progress bar)
- CreatorAttribution component (channel name, avatar, "Watch on YouTube" link)
- CoursePage (course detail with full video list, stats, Start Learning button)
- StudyPage (split-panel: player + sidebar, auto-advance, prev/next navigation)
- DashboardPage upgraded (import playlist modal, course grid, real stats)
- App.jsx updated with /course/:id and /study/:courseId routes
- Custom scrollbar and line-clamp CSS utilities
- Verified: Vite production build succeeds (0 errors)
- Verified: Server module loads without errors

### Next Phase
- **Phase 3**: AI Quiz Generation & Notes Module

---

## Phase Summary

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Backend Architecture, Database Schema & Legal Guardrails | ✅ Completed |
| 2 | YouTube Playlist Parser & Distraction-Free LMS UI | ✅ Completed |
| 3 | AI Quiz Generation & Notes Module | ⬜ Not Started |
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
