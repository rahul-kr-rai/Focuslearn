import { Link } from 'react-router-dom';
import { GraduationCap, Shield, ExternalLink } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-border-default bg-bg-secondary/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <GraduationCap className="w-5 h-5 text-accent-primary" />
              <span className="text-lg font-bold gradient-text">FocusLearn</span>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">
              Transform YouTube playlists into structured, distraction-free study courses.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-3">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/dashboard"
                  className="text-sm text-text-secondary hover:text-accent-primary transition-colors"
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  to="/takedown"
                  className="text-sm text-text-secondary hover:text-accent-primary transition-colors flex items-center gap-1"
                >
                  <Shield className="w-3.5 h-3.5" />
                  Creator Takedown Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-3">Legal</h3>
            <p className="text-xs text-text-tertiary leading-relaxed">
              All video content is streamed directly via YouTube&apos;s official embedding
              API and remains the intellectual property of the respective copyright owners.
              FocusLearn does not download, host, or store any video files.
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-6 border-t border-border-default flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-text-tertiary">
            &copy; {new Date().getFullYear()} FocusLearn. For educational purposes only.
          </p>
          <div className="flex items-center gap-4">
            <a
              href="https://www.youtube.com/t/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-text-tertiary hover:text-text-secondary transition-colors flex items-center gap-1"
            >
              YouTube ToS
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
