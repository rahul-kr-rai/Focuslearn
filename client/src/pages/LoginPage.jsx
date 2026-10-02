import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, LogIn, GraduationCap, Copy, Check, Sparkles } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import { DEMO_CREDENTIALS } from '../constants/demoCredentials';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedField, setCopiedField] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const { login, error, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const validate = () => {
    const errors = {};
    if (!email.trim()) errors.email = 'Email is required';
    if (!password) errors.password = 'Password is required';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    if (!validate()) return;

    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  };

  const copyToClipboard = (text, field) => {
    navigator.clipboard?.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 animate-fade-in">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-accent-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-accent-secondary/5 rounded-full blur-3xl" />
      </div>

      <Card className="relative w-full max-w-md" padding="lg">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-accent-primary/10 mb-4">
            <GraduationCap className="w-7 h-7 text-accent-primary" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">Welcome back</h1>
          <p className="text-sm text-text-secondary">
            Sign in to continue your learning journey
          </p>
        </div>

        {/* Demo Credentials Card */}
        <div className="relative mt-3 mb-5 px-3 pt-3.5 pb-2 rounded-lg border border-amber-500/40 bg-amber-500/10 text-xs">
          <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-bg-secondary text-amber-300 border border-amber-500/50 shadow-sm whitespace-nowrap">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Try demo details to explore this project
            </span>
          </div>
          <div className="flex items-center justify-between py-0.5">
            <span className="text-text-secondary">
              Demo user: <span className="font-mono text-text-primary font-medium">{DEMO_CREDENTIALS.email}</span>
            </span>
            <button
              type="button"
              onClick={() => copyToClipboard(DEMO_CREDENTIALS.email, 'email')}
              className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 transition-colors p-1 rounded hover:bg-amber-500/20"
              title="Copy demo user"
              aria-label="Copy demo email"
            >
              {copiedField === 'email' ? (
                <span className="text-emerald-400 flex items-center gap-1 text-[11px]">
                  <Check className="w-3.5 h-3.5" /> Copied
                </span>
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
          <div className="flex items-center justify-between py-0.5">
            <span className="text-text-secondary">
              Demo password: <span className="font-mono text-text-primary font-medium">{DEMO_CREDENTIALS.password}</span>
            </span>
            <button
              type="button"
              onClick={() => copyToClipboard(DEMO_CREDENTIALS.password, 'password')}
              className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 transition-colors p-1 rounded hover:bg-amber-500/20"
              title="Copy demo password"
              aria-label="Copy demo password"
            >
              {copiedField === 'password' ? (
                <span className="text-emerald-400 flex items-center gap-1 text-[11px]">
                  <Check className="w-3.5 h-3.5" /> Copied
                </span>
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-3 rounded-lg bg-accent-danger/10 border border-accent-danger/20">
            <p className="text-sm text-accent-danger">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Email"
            type="email"
            icon={Mail}
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={fieldErrors.email}
            autoComplete="email"
          />
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-text-secondary"
              >
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-xs font-medium text-accent-primary hover:text-accent-secondary transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              icon={Lock}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={fieldErrors.password}
              autoComplete="current-password"
            />
          </div>
          <Button
            type="submit"
            fullWidth
            loading={loading}
            icon={LogIn}
            size="lg"
          >
            Sign In
          </Button>
        </form>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-text-secondary">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="text-accent-primary hover:text-accent-secondary font-medium">
            Create one
          </Link>
        </p>
      </Card>
    </div>
  );
}
