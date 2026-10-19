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
  Link2,
  TrendingUp,
  ChevronRight,
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
        <div className="text-center max-w-xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-accent-primary/10 border border-accent-primary/20 mb-4">
            <Zap className="w-3.5 h-3.5 text-accent-primary" />
            <span className="text-xs font-semibold tracking-wider uppercase text-accent-primary">How It Works</span>
          </div>
          <h2 className="text-center text-3xl sm:text-4xl font-bold text-text-primary mb-4">
            From playlist to mastery in <span className="gradient-text">three steps</span>
          </h2>
          <p className="text-center text-text-secondary max-w-md mx-auto text-base">
            Convert any YouTube playlist into an interactive, distraction-free study course in minutes.
          </p>
        </div>

        <div className="relative max-w-5xl mx-auto">
          {/* Desktop Milestone Connecting Line */}
          <div
            className="hidden md:block absolute top-7 left-[16.67%] right-[16.67%] -translate-y-1/2 pointer-events-none z-0"
            aria-hidden="true"
          >
            {/* Background track line */}
            <div className="w-full h-0.5 bg-border-default/60" />

            {/* Glowing gradient connection line */}
            <div className="absolute inset-0 h-0.5 bg-gradient-to-r from-accent-primary via-accent-secondary to-accent-purple" />

            {/* Ambient blur glow */}
            <div className="absolute inset-0 h-0.5 bg-gradient-to-r from-accent-primary via-accent-secondary to-accent-purple blur-[3px] opacity-75" />

            {/* Directional Progress Nodes between milestones */}
            <div className="absolute top-1/2 left-[25%] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 rounded-full bg-bg-primary border border-accent-primary/40 shadow-sm text-accent-primary">
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
            <div className="absolute top-1/2 left-[75%] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 rounded-full bg-bg-primary border border-accent-secondary/40 shadow-sm text-accent-secondary">
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 relative z-10">
            {[
              {
                step: '01',
                title: 'Paste a Playlist URL',
                desc: "Drop any YouTube playlist link and we'll instantly parse, clean, and organize all lessons into a structured course syllabus.",
                icon: Link2,
                tag: 'Step 1: Import',
                gradient: 'from-accent-primary to-accent-secondary',
                badgeColor: 'bg-accent-primary/10 text-accent-primary border-accent-primary/30',
                nodeBorder: 'group-hover:border-accent-primary group-hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]',
                iconColor: 'text-accent-primary',
              },
              {
                step: '02',
                title: 'Study Distraction-Free',
                desc: 'Watch inside a clean, ad-free player. Capture timestamped notes, review summaries, and test recall with AI quizzes.',
                icon: BookOpen,
                tag: 'Step 2: Focus',
                gradient: 'from-accent-secondary to-accent-purple',
                badgeColor: 'bg-accent-secondary/10 text-accent-secondary border-accent-secondary/30',
                nodeBorder: 'group-hover:border-accent-secondary group-hover:shadow-[0_0_20px_rgba(6,182,212,0.3)]',
                iconColor: 'text-accent-secondary',
              },
              {
                step: '03',
                title: 'Track Your Progress',
                desc: 'Keep your momentum with daily study streaks, time tracking, and visual completion milestones as you master topics.',
                icon: TrendingUp,
                tag: 'Step 3: Master',
                gradient: 'from-accent-purple to-accent-primary',
                badgeColor: 'bg-accent-purple/10 text-accent-purple border-accent-purple/30',
                nodeBorder: 'group-hover:border-accent-purple group-hover:shadow-[0_0_20px_rgba(139,92,246,0.3)]',
                iconColor: 'text-accent-purple',
              },
            ].map((item, index, arr) => (
              <div key={item.step} className="flex flex-col items-center">
                <div className="group w-full flex flex-col items-center text-center">
                  {/* Milestone Node */}
                  <div className="relative">
                    <div
                      className={`relative z-10 w-14 h-14 rounded-2xl bg-bg-primary border-2 border-border-default ${item.nodeBorder} flex items-center justify-center shadow-md transition-all duration-300 group-hover:scale-110`}
                    >
                      <item.icon className={`w-6 h-6 ${item.iconColor} transition-transform duration-300 group-hover:scale-110`} />
                    </div>

                    {/* Step Number Badge */}
                    <span className="absolute -top-2.5 -right-2 z-20 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-bg-elevated border border-border-default text-text-primary shadow-sm">
                      {item.step}
                    </span>
                  </div>

                  {/* Milestone Card */}
                  <div className="w-full mt-6 p-6 rounded-2xl bg-bg-secondary/60 backdrop-blur-md border border-border-default hover:border-border-accent transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl relative overflow-hidden flex flex-col items-center text-center">
                    {/* Top gradient highlight strip */}
                    <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${item.gradient} opacity-40 group-hover:opacity-100 transition-opacity duration-300`} />

                    {/* Milestone Tag */}
                    <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full border mb-3 ${item.badgeColor}`}>
                      {item.tag}
                    </span>

                    <h3 className="text-lg font-bold text-text-primary mb-2 group-hover:text-accent-primary transition-colors">
                      {item.title}
                    </h3>

                    <p className="text-sm text-text-secondary leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>

                {/* Mobile Connecting Line to next milestone */}
                {index < arr.length - 1 && (
                  <div className="md:hidden flex flex-col items-center my-4" aria-hidden="true">
                    <div className="w-0.5 h-8 bg-gradient-to-b from-accent-primary to-accent-secondary rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                    <div className="w-6 h-6 rounded-full bg-bg-primary border border-border-default flex items-center justify-center -mt-2 shadow-sm text-accent-secondary">
                      <ChevronRight className="w-3.5 h-3.5 rotate-90" />
                    </div>
                    <div className="w-0.5 h-4 bg-gradient-to-b from-accent-secondary to-accent-purple rounded-full opacity-60" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Legal Disclaimer */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <LegalDisclaimer />
      </section>
    </div>
  );
}
