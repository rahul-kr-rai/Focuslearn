import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Check,
  X,
} from 'lucide-react';
import { authAPI } from '../services/api';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Loader from '../components/ui/Loader';

export default function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();

  // Verification state
  const [verifying, setVerifying] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [associatedEmail, setAssociatedEmail] = useState('');

  // Form state
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Verify token on mount
  useEffect(() => {
    let isMounted = true;

    async function checkToken() {
      if (!token) {
        setVerifying(false);
        setIsTokenValid(false);
        return;
      }

      try {
        const res = await authAPI.verifyResetToken(token);
        if (isMounted) {
          setIsTokenValid(true);
          if (res.data?.data?.email) {
            setAssociatedEmail(res.data.data.email);
          }
        }
      } catch {
        if (isMounted) {
          setIsTokenValid(false);
        }
      } finally {
        if (isMounted) {
          setVerifying(false);
        }
      }
    }

    checkToken();

    return () => {
      isMounted = false;
    };
  }, [token]);

  // Password strength calculation
  const calculateStrength = (pass) => {
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 10) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass) || /[A-Z]/.test(pass)) score += 1;
    return score;
  };

  const strength = calculateStrength(password);

  const getStrengthLabel = (s) => {
    if (!password) return '';
    if (s <= 1) return { label: 'Weak', color: 'bg-accent-danger text-accent-danger' };
    if (s === 2) return { label: 'Fair', color: 'bg-accent-warm text-accent-warm' };
    if (s === 3) return { label: 'Good', color: 'bg-accent-primary text-accent-primary' };
    return { label: 'Strong', color: 'bg-accent-success text-accent-success' };
  };

  const strengthInfo = getStrengthLabel(strength);

  const validate = () => {
    const errors = {};
    if (!password) {
      errors.password = 'New password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    if (!validate()) return;

    setLoading(true);
    try {
      await authAPI.resetPassword(token, { password });
      setIsSuccess(true);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        'Failed to reset password. The link may have expired.';
      setApiError(msg);
    } finally {
      setLoading(false);
    }
  };

  // 1. Initial Verification Loading
  if (verifying) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
        <Loader text="Verifying password reset link..." />
      </div>
    );
  }

  // 2. Invalid or Expired Token Screen
  if (!isTokenValid) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 animate-fade-in">
        <Card className="relative w-full max-w-md text-center" padding="lg">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent-danger/10 border border-accent-danger/20 mb-5">
            <AlertTriangle className="w-8 h-8 text-accent-danger" />
          </div>

          <h1 className="text-2xl font-bold text-text-primary mb-2">
            Link Expired or Invalid
          </h1>

          <p className="text-sm text-text-secondary mb-6 leading-relaxed">
            This password reset link is invalid or has expired. For your account security, password reset links are single-use and expire after 15 minutes.
          </p>

          <div className="space-y-3">
            <Button
              type="button"
              fullWidth
              size="lg"
              onClick={() => navigate('/forgot-password')}
            >
              Request New Reset Link
            </Button>

            <Link
              to="/login"
              className="inline-block text-sm text-text-secondary hover:text-text-primary transition-colors py-2"
            >
              Back to Sign In
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  // 3. Reset Success Screen
  if (isSuccess) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 animate-fade-in">
        <Card className="relative w-full max-w-md text-center" padding="lg" glow>
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent-success/10 border border-accent-success/30 mb-5 shadow-lg shadow-accent-success/10">
            <CheckCircle2 className="w-8 h-8 text-accent-success" />
          </div>

          <h1 className="text-2xl font-bold text-text-primary mb-2">
            Password Reset Complete!
          </h1>

          <p className="text-sm text-text-secondary mb-6 leading-relaxed">
            Your password has been successfully updated. You can now use your new credentials to log in to your account.
          </p>

          <Button
            type="button"
            fullWidth
            size="lg"
            icon={ArrowRight}
            onClick={() => navigate('/login')}
          >
            Sign In Now
          </Button>
        </Card>
      </div>
    );
  }

  // 4. Reset Password Form Screen
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 animate-fade-in">
      {/* Background ambient decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-accent-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-accent-secondary/10 rounded-full blur-3xl" />
      </div>

      <Card className="relative w-full max-w-md" padding="lg" glow>
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-accent-primary/10 border border-accent-primary/20 mb-4 shadow-glow-blue">
            <ShieldCheck className="w-7 h-7 text-accent-primary" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">
            Set new password
          </h1>
          <p className="text-sm text-text-secondary">
            {associatedEmail ? (
              <>
                Resetting password for <span className="text-text-primary font-medium">{associatedEmail}</span>
              </>
            ) : (
              'Enter a strong new password for your account'
            )}
          </p>
        </div>

        {/* API Error Alert */}
        {apiError && (
          <div className="mb-6 p-3.5 rounded-lg bg-accent-danger/10 border border-accent-danger/20 flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-accent-danger shrink-0 mt-0.5" />
            <p className="text-sm text-accent-danger">{apiError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* New Password */}
          <div>
            <label
              htmlFor="new-password"
              className="block text-sm font-medium text-text-secondary mb-1.5"
            >
              New Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="w-4 h-4 text-text-tertiary" />
              </div>
              <input
                id="new-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) {
                    setFieldErrors((prev) => ({ ...prev, password: '' }));
                  }
                }}
                className={`
                  w-full bg-bg-secondary border border-border-default rounded-lg
                  py-2.5 pl-10 pr-10 text-sm text-text-primary placeholder-text-tertiary
                  transition-all duration-200
                  focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/50
                  hover:border-border-default/80
                  ${fieldErrors.password ? 'border-accent-danger focus:border-accent-danger focus:ring-accent-danger/50' : ''}
                `}
                autoComplete="new-password"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-tertiary hover:text-text-secondary transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="mt-1.5 text-xs text-accent-danger">{fieldErrors.password}</p>
            )}

            {/* Password Strength Indicator */}
            {password && (
              <div className="mt-2.5 animate-fade-in">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-text-tertiary">Password strength:</span>
                  <span className={`font-medium ${strengthInfo?.color?.split(' ')[1]}`}>
                    {strengthInfo?.label}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1.5 h-1.5">
                  {[1, 2, 3, 4].map((step) => (
                    <div
                      key={step}
                      className={`h-full rounded-full transition-all duration-300 ${
                        step <= strength
                          ? strengthInfo?.color?.split(' ')[0]
                          : 'bg-bg-tertiary'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label
              htmlFor="confirm-password"
              className="block text-sm font-medium text-text-secondary mb-1.5"
            >
              Confirm New Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="w-4 h-4 text-text-tertiary" />
              </div>
              <input
                id="confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (fieldErrors.confirmPassword) {
                    setFieldErrors((prev) => ({ ...prev, confirmPassword: '' }));
                  }
                }}
                className={`
                  w-full bg-bg-secondary border border-border-default rounded-lg
                  py-2.5 pl-10 pr-10 text-sm text-text-primary placeholder-text-tertiary
                  transition-all duration-200
                  focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/50
                  hover:border-border-default/80
                  ${fieldErrors.confirmPassword ? 'border-accent-danger focus:border-accent-danger focus:ring-accent-danger/50' : ''}
                `}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-tertiary hover:text-text-secondary transition-colors"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Live Matching feedback */}
            {confirmPassword && (
              <div className="mt-1.5 flex items-center gap-1.5 text-xs">
                {password === confirmPassword ? (
                  <span className="inline-flex items-center gap-1 text-accent-success">
                    <Check className="w-3.5 h-3.5" /> Passwords match
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-accent-danger">
                    <X className="w-3.5 h-3.5" /> Passwords do not match
                  </span>
                )}
              </div>
            )}

            {fieldErrors.confirmPassword && (
              <p className="mt-1.5 text-xs text-accent-danger">{fieldErrors.confirmPassword}</p>
            )}
          </div>

          {/* Requirements Checklist */}
          <div className="p-3 rounded-lg bg-bg-tertiary/30 border border-border-default text-xs text-text-tertiary space-y-1">
            <div className="flex items-center gap-1.5">
              <span className={password.length >= 6 ? 'text-accent-success' : 'text-text-tertiary'}>
                {password.length >= 6 ? '✓' : '•'}
              </span>
              <span>At least 6 characters long</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={/[0-9]/.test(password) ? 'text-accent-success' : 'text-text-tertiary'}>
                {/[0-9]/.test(password) ? '✓' : '•'}
              </span>
              <span>Contains at least one number (recommended)</span>
            </div>
          </div>

          <Button
            type="submit"
            fullWidth
            loading={loading}
            size="lg"
          >
            Reset Password
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            Back to Sign In
          </Link>
        </div>
      </Card>
    </div>
  );
}
