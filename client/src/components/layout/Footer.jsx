import { Link } from 'react-router-dom';
import {
  GraduationCap,
  Shield,
  ExternalLink,
  ShieldAlert,
  Lock,
  LayoutDashboard,
  BarChart3,
  FileCheck,
} from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-border-default bg-bg-secondary/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Column 1: Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-accent-primary/10">
                <GraduationCap className="w-5 h-5 text-accent-primary" />
              </div>
              <span className="text-lg font-bold gradient-text">FocusLearn</span>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              Transform YouTube playlists into structured, distraction-free study courses with AI-powered quizzes and timestamped notes.
            </p>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-accent-success/10 border border-accent-success/20 text-accent-success text-[11px] font-medium">
              <FileCheck className="w-3 h-3" />
              <span>YouTube API Compliant</span>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary mb-3">
              Platform Links
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  to="/dashboard"
                  className="text-text-secondary hover:text-accent-primary transition-colors flex items-center gap-2"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  to="/progress"
                  className="text-text-secondary hover:text-accent-primary transition-colors flex items-center gap-2"
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  Analytics & Streak
                </Link>
              </li>
              <li>
                <Link
                  to="/takedown"
                  className="text-text-secondary hover:text-accent-primary transition-colors flex items-center gap-2"
                >
                  <Shield className="w-3.5 h-3.5 text-accent-primary" />
                  Creator Takedown Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Legal & Terms */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary mb-3">
              Legal & Compliance
            </h3>
            <p className="text-xs text-text-tertiary leading-relaxed mb-3">
              Videos stream directly via YouTube&apos;s official IFrame Player API. Content remains
              the sole property of copyright owners. No video files are hosted.
            </p>
            <a
              href="https://www.youtube.com/t/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-accent-primary hover:underline inline-flex items-center gap-1"
            >
              YouTube Terms of Service
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Column 4: Administration Section (Distinct Admin Menu/Link) */}
          <div className="bg-bg-primary/50 p-4 rounded-xl border border-border-default/80 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-accent-purple" />
                  Administration
                </h3>
                <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-accent-purple/15 text-accent-purple border border-accent-purple/20">
                  Staff
                </span>
              </div>
              <p className="text-xs text-text-tertiary leading-relaxed mb-4">
                Internal compliance tools and copyright adjudication console.
              </p>
            </div>

            <div className="space-y-2">
              <Link
                to="/admin/takedowns"
                className="group flex items-center justify-between p-2.5 rounded-lg bg-bg-secondary hover:bg-accent-purple/10 border border-border-default hover:border-accent-purple/40 transition-all text-xs font-semibold text-text-secondary hover:text-accent-purple"
              >
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-accent-purple shrink-0 group-hover:scale-110 transition-transform" />
                  <span>Admin Review Portal</span>
                </div>
                <span className="text-[10px] text-text-tertiary group-hover:text-accent-purple">→</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-6 border-t border-border-default flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-tertiary">
          <p>
            &copy; {new Date().getFullYear()} FocusLearn. For educational purposes only.
          </p>
          <div className="flex items-center gap-4">
            <Link to="/takedown" className="hover:text-text-secondary transition-colors">
              DMCA & Takedowns
            </Link>
            <span>•</span>
            <Link to="/admin/takedowns" className="hover:text-accent-purple transition-colors">
              Admin Console
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
