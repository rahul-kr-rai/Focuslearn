import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  GraduationCap,
  Play,
  Brain,
  BarChart3,
  Shield,
  ArrowRight,
  Sparkles,
  BookOpen,
  Zap,
} from 'lucide-react';
import Button from '../components/ui/Button';
import LegalDisclaimer from '../components/layout/LegalDisclaimer';

export default function HomePage() {
  const { isAuthenticated } = useAuth();

  const features = [
    {
      icon: Play,
      title: 'Distraction-Free Player',
      description: 'Watch YouTube videos in a clean, focused environment without recommendations or ads.',
      color: 'text-accent-primary',
      bg: 'bg-accent-primary/10',
    },
    {
      icon: Brain,
      title: 'AI-Powered Quizzes',
      description: 'Auto-generated MCQ quizzes using Google Gemini AI to test your understanding.',
      color: 'text-accent-purple',
      bg: 'bg-accent-purple/10',
    },
    {
      icon: BookOpen,
      title: 'Timestamped Notes',
      description: 'Take notes linked to exact video moments. Click a note to jump back instantly.',
      color: 'text-accent-secondary',
      bg: 'bg-accent-secondary/10',
    },
    {
      icon: BarChart3,
      title: 'Progress Tracking',
      description: 'Track completion, study streaks, and goals across all your courses.',
      color: 'text-accent-success',
      bg: 'bg-accent-success/10',
    },
    {
      icon: Shield,
      title: 'Copyright Compliant',
      description: 'All videos stream via official YouTube embeds. Creator rights fully respected.',
      color: 'text-accent-warm',
      bg: 'bg-accent-warm/10',
    },
    {
      icon: Zap,
      title: 'Instant Import',
      description: 'Paste any YouTube playlist URL and get a structured course in seconds.',
      color: 'text-accent-danger',
      bg: 'bg-accent-danger/10',
    },
  ];

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-accent-primary/5 via-transparent to-accent-secondary/5" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-secondary/5 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-primary/10 border border-accent-primary/20 mb-6">
              <Sparkles className="w-4 h-4 text-accent-primary" />
              <span className="text-sm font-medium text-accent-primary">AI-Powered Learning</span>
            </div>

            <h1 className="text-center text-4xl sm:text-5xl lg:text-6xl font-bold text-text-primary leading-tight tracking-tight mb-6">
              Turn YouTube Playlists into{' '}
              <span className="gradient-text">Focused Courses</span>
            </h1>

            <p className="text-center text-lg sm:text-xl text-text-secondary mb-10 max-w-2xl mx-auto leading-relaxed">
              Import any educational playlist and study in a distraction-free environment
              with AI quizzes, timestamped notes, and progress tracking.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {isAuthenticated ? (
                <Link to="/dashboard">
                  <Button size="lg" icon={ArrowRight}>
                    Go to Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/register">
                    <Button size="lg" icon={ArrowRight}>
                      Get Started Free
                    </Button>
                  </Link>
                  <Link to="/login">
                    <Button size="lg" variant="secondary">
                      Sign In
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-center text-3xl sm:text-4xl font-bold text-text-primary mb-4">
            Everything you need to <span className="gradient-text">learn better</span>
          </h2>
          <p className="text-center text-text-secondary max-w-xl mx-auto leading-relaxed">
            A complete learning platform built around your favorite YouTube educational content.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group p-6 rounded-xl bg-bg-secondary border border-border-default hover:border-border-accent transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <div className={`w-12 h-12 rounded-xl ${feature.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className={`w-6 h-6 ${feature.color}`} />
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">{feature.title}</h3>
              <p className="text-sm text-text-secondary leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-xl mx-auto mb-14">
          <h2 className="text-center text-3xl sm:text-4xl font-bold text-text-primary mb-4">
            How it works
          </h2>
          <p className="text-center text-text-secondary max-w-md mx-auto">
            Convert any YouTube playlist into an interactive study course in three simple steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { step: '01', title: 'Paste a Playlist URL', desc: 'Drop any YouTube playlist link and we\'ll parse it into a structured course.' },
            { step: '02', title: 'Study Distraction-Free', desc: 'Watch videos in a clean player with notes, quizzes, and no distractions.' },
            { step: '03', title: 'Track Your Progress', desc: 'Set goals, maintain streaks, and see your completion grow over time.' },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-accent-primary/10 mb-4">
                <span className="text-xl font-bold gradient-text">{item.step}</span>
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">{item.title}</h3>
              <p className="text-sm text-text-secondary">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Legal Disclaimer */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <LegalDisclaimer />
      </section>
    </div>
  );
}
