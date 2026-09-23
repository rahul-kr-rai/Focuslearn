# FocusLearn — Task Checklist

## Phase 1: Backend Architecture, Database Schema & Legal Guardrails

### Server Scaffolding
- [x] Initialize `server/package.json` with all dependencies
- [x] Create `server/server.js` entry point
- [x] Create `server/src/app.js` Express configuration
- [x] Create `server/src/config/db.js` MongoDB connection
- [x] Create `server/src/config/env.js` environment loader
- [x] Create `server/.env.example`

### Mongoose Models
- [x] `server/src/models/User.js` — with password hashing
- [x] `server/src/models/Course.js` — playlist-linked
- [x] `server/src/models/Video.js` — with embeddable flag
- [x] `server/src/models/Quiz.js` — with question subdoc
- [x] `server/src/models/Note.js` — timestamped notes
- [x] `server/src/models/Progress.js` — with compound index
- [x] `server/src/models/TakedownRequest.js` — legal compliance

### Middleware
- [x] `server/src/middleware/auth.js` — JWT verification
- [x] `server/src/middleware/errorHandler.js` — global error handler
- [x] `server/src/middleware/rateLimiter.js` — rate limiting

### Utilities & Services
- [x] `server/src/utils/youtubeHelpers.js` — URL parsing, duration conversion
- [x] `server/src/utils/apiResponse.js` — standardized responses
- [x] `server/src/services/youtubeService.js` — YouTube Data API v3 wrapper

### Auth Routes
- [x] `server/src/routes/authRoutes.js`
- [x] `server/src/controllers/authController.js` — register, login, me

### Frontend Scaffolding
- [x] Initialize Vite + React client project
- [x] Install Tailwind CSS v4 + lucide-react + react-router-dom + axios
- [x] Create design system (`index.css` with @theme tokens)
- [x] Create base layout components (Navbar, Footer, LegalDisclaimer)
- [x] Create reusable UI primitives (Button, Input, Card, Loader, Modal)
- [x] Create placeholder pages with routing (Home, Login, Register, Dashboard)
- [x] Create `client/src/services/api.js` Axios instance
- [x] Create `client/src/context/AuthContext.jsx`

### Tracking
- [x] Create `phase.md` progress tracker
- [x] Verify client dev server runs ✅ (No console errors)

---

## Phase 2: YouTube Playlist Parser & Distraction-Free LMS UI
- [x] Course controller + routes (CRUD + ingestion)
- [x] Playlist ingestion flow with embed checks
- [x] YouTube IFrame Player component
- [x] Study page (split-panel layout)
- [x] Course import UI on dashboard
- [x] Creator attribution component
- [x] Module/video list sidebar

---

## Phase 3: AI Quiz Generation & Notes Module
- [x] Gemini service integration
- [x] Quiz routes + controller
- [x] Quiz generation + submission endpoints
- [x] Notes routes + controller (CRUD)
- [x] Quiz panel UI (interactive MCQ)
- [x] Notes editor with timestamp linking

---

## Phase 4: Progress Tracking, Analytics & Takedown Portal
- [ ] Progress routes + controller
- [ ] Progress dashboard UI (completion rings, streaks, goals)
- [ ] Takedown routes + controller
- [ ] Takedown form page (public)
- [ ] Legal disclaimer footer integration
- [ ] Final polish & responsive testing
