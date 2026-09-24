import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Mail,
  ArrowLeft,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Send,
  RefreshCw,
} from 'lucide-react';
import { authAPI } from '../services/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldError, setFieldError] = useState('');
  const [apiError, setApiError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const validate = () => {
    setFieldError('');
    if (!email.trim()) {
      setFieldError('Email address is required');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setFieldError('Please enter a valid email address');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setApiError('');

    if (!validate()) return;

    setLoading(true);
    try {
      await authAPI.forgotPassword({ email: email.trim() });
      setIsSubmitted(true);
      setResendCooldown(60);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        'Failed to process password reset. Please try again.';
      setApiError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 animate-fade-in">
      {/* Background ambient decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-accent-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-accent-secondary/10 rounded-full blur-3xl" />
      </div>

      <Card className="relative w-full max-w-md" padding="lg" glow>
        {!isSubmitted ? (
          <>
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-accent-primary/10 border border-accent-primary/20 mb-4 shadow-glow-blue">
                <KeyRound className="w-7 h-7 text-accent-primary" />
              </div>
              <h1 className="text-2xl font-bold text-text-primary mb-2">
                Forgot password?
              </h1>
              <p className="text-sm text-text-secondary leading-relaxed">
                No worries! Enter your account email and we&apos;ll send you a secure link to reset your password.
              </p>
            </div>

            {/* API Error Alert */}
            {apiError && (
              <div className="mb-6 p-3.5 rounded-lg bg-accent-danger/10 border border-accent-danger/20 flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-accent-danger shrink-0 mt-0.5" />
                <p className="text-sm text-accent-danger">{apiError}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="Email Address"
                type="email"
                icon={Mail}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldError) setFieldError('');
                }}
                error={fieldError}
                autoComplete="email"
                autoFocus
              />

              <Button
                type="submit"
                fullWidth
                loading={loading}
                icon={Send}
                size="lg"
              >
                Send Reset Link
              </Button>
            </form>

            {/* Back to Login */}
            <div className="mt-6 text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary font-medium transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Sign In
              </Link>
            </div>
          </>
        ) : (
          /* Success Screen */
          <div className="text-center animate-fade-in">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent-success/10 border border-accent-success/30 mb-5 shadow-lg shadow-accent-success/10">
              <CheckCircle2 className="w-8 h-8 text-accent-success" />
            </div>

            <h2 className="text-2xl font-bold text-text-primary mb-2">
              Check your email
            </h2>

            <p className="text-sm text-text-secondary mb-4 leading-relaxed">
              We&apos;ve sent a password reset link to:
              <br />
              <span className="font-semibold text-text-primary">{email}</span>
            </p>

            <div className="p-3 rounded-lg bg-bg-tertiary/40 border border-border-default mb-6 text-xs text-text-tertiary">
              ⏳ The link will expire in <span className="text-accent-warm font-medium">15 minutes</span>. If you don&apos;t see it, check your spam or junk folder.
            </div>

            {/* Error Alert on Resend */}
            {apiError && (
              <div className="mb-4 p-3 rounded-lg bg-accent-danger/10 border border-accent-danger/20 flex items-start gap-2.5 text-left">
                <AlertCircle className="w-4 h-4 text-accent-danger shrink-0 mt-0.5" />
                <p className="text-xs text-accent-danger">{apiError}</p>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3">
              <Button
                type="button"
                variant="secondary"
                fullWidth
                disabled={resendCooldown > 0 || loading}
                loading={loading}
                icon={RefreshCw}
                onClick={() => handleSubmit()}
              >
                {resendCooldown > 0
                  ? `Resend available in ${resendCooldown}s`
                  : 'Resend Email'}
              </Button>

              <div>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary font-medium transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Sign In
                </Link>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
