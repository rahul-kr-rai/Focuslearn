import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Loader from './components/ui/Loader';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import DashboardPage from './pages/DashboardPage';
import CoursePage from './pages/CoursePage';
import StudyPage from './pages/StudyPage';
import ProgressPage from './pages/ProgressPage';
import TakedownPage from './pages/TakedownPage';
import AdminReviewPage from './pages/AdminReviewPage';
import CourseQuizzesPage from './pages/CourseQuizzesPage';
import QuizReviewPage from './pages/QuizReviewPage';
import QuizTakingPage from './pages/QuizTakingPage';

/**
 * Protected route wrapper — redirects to login if not authenticated.
 */
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Loader fullPage text="Authenticating..." />;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;

  return children;
}

/**
 * Public route wrapper — redirects to dashboard if already authenticated.
 */
function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <Loader fullPage text="Loading..." />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return children;
}

function AppRoutes() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <RegisterPage />
              </PublicRoute>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <PublicRoute>
                <ForgotPasswordPage />
              </PublicRoute>
            }
          />
          <Route
            path="/reset-password/:token"
            element={
              <PublicRoute>
                <ResetPasswordPage />
              </PublicRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/progress"
            element={
              <ProtectedRoute>
                <ProgressPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/course/:id"
            element={
              <ProtectedRoute>
                <CoursePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/course/:id/quizzes"
            element={
              <ProtectedRoute>
                <CourseQuizzesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/study/:courseId"
            element={
              <ProtectedRoute>
                <StudyPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/course/:courseId/quiz/:videoId"
            element={
              <ProtectedRoute>
                <QuizTakingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/quiz/:videoId"
            element={
              <ProtectedRoute>
                <QuizTakingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/quiz/attempt/:attemptId"
            element={
              <ProtectedRoute>
                <QuizReviewPage />
              </ProtectedRoute>
            }
          />

          {/* Public Takedown Portal */}
          <Route path="/takedown" element={<TakedownPage />} />

          {/* Admin Review Portal (Authenticated) */}
          <Route
            path="/admin/takedowns"
            element={
              <ProtectedRoute>
                <AdminReviewPage />
              </ProtectedRoute>
            }
          />
          <Route path="/admin/review" element={<Navigate to="/admin/takedowns" replace />} />
          <Route path="/admin" element={<Navigate to="/admin/takedowns" replace />} />

          {/* 404 Catch-all */}
          <Route
            path="*"
            element={
              <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
                <h1 className="text-6xl font-bold gradient-text mb-4">404</h1>
                <p className="text-text-secondary mb-6">Page not found</p>
                <a
                  href="/"
                  className="px-4 py-2 rounded-lg bg-accent-primary hover:bg-blue-600 text-white text-sm font-medium transition-colors"
                >
                  Go Home
                </a>
              </div>
            }
          />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
