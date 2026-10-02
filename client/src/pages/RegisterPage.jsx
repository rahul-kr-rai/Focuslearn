import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, UserPlus, GraduationCap, Copy, Check, Sparkles } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import { DEMO_CREDENTIALS } from '../constants/demoCredentials';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedField, setCopiedField] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const { register, error, clearError } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const errors = {};
    if (!name.trim()) errors.name = 'Name is required';
    if (name.trim().length < 2) errors.name = 'Name must be at least 2 characters';
    if (!email.trim()) errors.email = 'Email is required';
    if (!password) errors.password = 'Password is required';
    if (password.length < 6) errors.password = 'Password must be at least 6 characters';
    if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    if (!validate()) return;

    setLoading(true);
    const result = await register(name, email, password);
    setLoading(false);

    if (result.success) {
      navigate('/dashboard');
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
        <div className="absolute top-1/4 right-1/3 w-64 h-64 bg-accent-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-accent-secondary/5 rounded-full blur-3xl" />
      </div>

      <Card className="relative w-full max-w-md" padding="lg">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-accent-primary/10 mb-4">
            <GraduationCap className="w-7 h-7 text-accent-primary" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">Create your account</h1>
          <p className="text-sm text-text-secondary">
            Start transforming playlists into focused learning
          </p>
        </div>

        {/* Demo Credentials Card */}
        <div className="relative mt-3 mb-5 px-3 pt-3.5 pb-2 rounded-lg border border-amber-500/40 bg-amber-500/10 text-xs">
          <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-bg-secondary text-amber-300 border border-amber-500/50 shadow-sm whitespace-nowrap">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Try demo to explore this project
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
              aria-label="Copy demo user"
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
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            type="text"
            icon={User}
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={fieldErrors.name}
            autoComplete="name"
          />
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
          <Input
            label="Password"
            type="password"
            icon={Lock}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={fieldErrors.password}
            autoComplete="new-password"
          />
          <Input
            label="Confirm Password"
            type="password"
            icon={Lock}
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={fieldErrors.confirmPassword}
            autoComplete="new-password"
          />
          <Button
            type="submit"
            fullWidth
            loading={loading}
            icon={UserPlus}
            size="lg"
            className="mt-2"
          >
            Create Account
          </Button>
        </form>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-text-secondary">
          Already have an account?{' '}
          <Link to="/login" className="text-accent-primary hover:text-accent-secondary font-medium">
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  );
}
