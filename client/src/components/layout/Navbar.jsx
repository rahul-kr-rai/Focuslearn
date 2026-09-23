import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  GraduationCap,
  LayoutDashboard,
  BarChart3,
  Shield,
  LogOut,
  LogIn,
  UserPlus,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMobileMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  const navLinkClass = (path) =>
    `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
      isActive(path)
        ? 'bg-accent-primary/10 text-accent-primary'
        : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
    }`;

  return (
    <nav className="sticky top-0 z-40 glass border-b border-border-default">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="p-2 rounded-lg bg-accent-primary/10 group-hover:bg-accent-primary/20 transition-colors duration-200">
              <GraduationCap className="w-5 h-5 text-accent-primary" />
            </div>
            <span className="text-lg font-bold gradient-text">FocusLearn</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className={navLinkClass('/dashboard')}>
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
                <Link to="/progress" className={navLinkClass('/progress')}>
                  <BarChart3 className="w-4 h-4" />
                  Analytics
                </Link>
                <Link to="/takedown" className={navLinkClass('/takedown')}>
                  <Shield className="w-4 h-4" />
                  Takedown
                </Link>
                <div className="flex items-center gap-3 ml-4 pl-4 border-l border-border-default">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-accent-primary/20 flex items-center justify-center">
                      <span className="text-xs font-semibold text-accent-primary">
                        {user?.name?.charAt(0)?.toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-text-primary">
                      {user?.name}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 rounded-lg text-text-tertiary hover:text-accent-danger hover:bg-accent-danger/10 transition-all duration-200"
                    title="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link to="/takedown" className={navLinkClass('/takedown')}>
                  <Shield className="w-4 h-4" />
                  Takedown Portal
                </Link>
                <Link to="/login" className={navLinkClass('/login')}>
                  <LogIn className="w-4 h-4" />
                  Login
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-accent-primary hover:bg-blue-600 text-white transition-all duration-200 shadow-md hover:shadow-lg shrink-0 whitespace-nowrap"
                >
                  <UserPlus className="w-4 h-4 text-white" />
                  <span className="text-white font-medium">Sign Up</span>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border-default bg-bg-secondary animate-fade-in">
          <div className="px-4 py-3 space-y-1">
            {isAuthenticated ? (
              <>
                <div className="flex items-center gap-2 px-3 py-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-accent-primary/20 flex items-center justify-center">
                    <span className="text-xs font-semibold text-accent-primary">
                      {user?.name?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm font-medium">{user?.name}</span>
                </div>
                <Link
                  to="/dashboard"
                  className={navLinkClass('/dashboard')}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
                <Link
                  to="/progress"
                  className={navLinkClass('/progress')}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <BarChart3 className="w-4 h-4" />
                  Analytics
                </Link>
                <Link
                  to="/takedown"
                  className={navLinkClass('/takedown')}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Shield className="w-4 h-4" />
                  Takedown Portal
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium text-accent-danger hover:bg-accent-danger/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/takedown"
                  className={navLinkClass('/takedown')}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Shield className="w-4 h-4" />
                  Takedown Portal
                </Link>
                <Link
                  to="/login"
                  className={navLinkClass('/login')}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <LogIn className="w-4 h-4" />
                  Login
                </Link>
                <Link
                  to="/register"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-accent-primary hover:bg-accent-primary/10 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <UserPlus className="w-4 h-4" />
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
