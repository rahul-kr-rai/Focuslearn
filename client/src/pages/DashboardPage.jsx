import { useAuth } from '../context/AuthContext';
import {
  BookOpen,
  Plus,
  TrendingUp,
  Clock,
  Flame,
} from 'lucide-react';
import Card from '../components/ui/Card';
import LegalDisclaimer from '../components/layout/LegalDisclaimer';

export default function DashboardPage() {
  const { user } = useAuth();

  const stats = [
    {
      label: 'Enrolled Courses',
      value: user?.enrolledCourses?.length || 0,
      icon: BookOpen,
      color: 'text-accent-primary',
      bg: 'bg-accent-primary/10',
    },
    {
      label: 'Study Streak',
      value: `${user?.studyStreak || 0} days`,
      icon: Flame,
      color: 'text-accent-warm',
      bg: 'bg-accent-warm/10',
    },
    {
      label: 'Study Time',
      value: '0h 0m',
      icon: Clock,
      color: 'text-accent-secondary',
      bg: 'bg-accent-secondary/10',
    },
    {
      label: 'Completion',
      value: '0%',
      icon: TrendingUp,
      color: 'text-accent-success',
      bg: 'bg-accent-success/10',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary mb-1">
          Welcome back, <span className="gradient-text">{user?.name}</span>
        </h1>
        <p className="text-text-secondary">Here&apos;s your learning overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <Card key={stat.label} hover padding="md">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${stat.bg}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-xs text-text-tertiary font-medium">{stat.label}</p>
                <p className="text-xl font-bold text-text-primary">{stat.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Courses Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text-primary">My Courses</h2>
          {/* Import button will be functional in Phase 2 */}
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-primary hover:bg-blue-600 text-white text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg cursor-pointer"
            onClick={() => {}} // Phase 2
          >
            <Plus className="w-4 h-4" />
            Import Playlist
          </button>
        </div>

        {/* Empty state */}
        <Card className="text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-bg-tertiary mb-4">
            <BookOpen className="w-8 h-8 text-text-tertiary" />
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">No courses yet</h3>
          <p className="text-sm text-text-secondary max-w-md mx-auto mb-6">
            Import your first YouTube playlist to get started. Paste a playlist URL and
            we&apos;ll turn it into a structured course.
          </p>
          <button
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent-primary hover:bg-blue-600 text-white text-sm font-medium transition-all duration-200 shadow-md cursor-pointer"
            onClick={() => {}} // Phase 2
          >
            <Plus className="w-4 h-4" />
            Import Your First Playlist
          </button>
        </Card>
      </div>

      {/* Legal Disclaimer */}
      <LegalDisclaimer compact />
    </div>
  );
}
