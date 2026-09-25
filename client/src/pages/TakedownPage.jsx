import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Send,
  ExternalLink,
  Clock,
  FileCheck,
  Info,
  Lock,
} from 'lucide-react';
import { takedownAPI } from '../services/api';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

export default function TakedownPage() {
  // Form state
  const [formData, setFormData] = useState({
    requesterName: '',
    requesterEmail: '',
    channelUrl: '',
    playlistUrl: '',
    reason: '',
    declaration: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submittedData, setSubmittedData] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);

    if (!formData.requesterName.trim() || !formData.requesterEmail.trim()) {
      setSubmitError('Name and email are required.');
      return;
    }
    if (!formData.channelUrl.trim()) {
      setSubmitError('YouTube channel URL is required.');
      return;
    }
    if (!formData.reason.trim()) {
      setSubmitError('Please explain the reason for the takedown request.');
      return;
    }
    if (!formData.declaration) {
      setSubmitError('You must confirm the legal declaration checkbox.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await takedownAPI.submit({
        requesterName: formData.requesterName,
        requesterEmail: formData.requesterEmail,
        channelUrl: formData.channelUrl,
        playlistUrl: formData.playlistUrl || null,
        reason: formData.reason,
      });

      setSubmittedData(res.data.data);
      setFormData({
        requesterName: '',
        requesterEmail: '',
        channelUrl: '',
        playlistUrl: '',
        reason: '',
        declaration: false,
      });
    } catch (err) {
      setSubmitError(
        err.response?.data?.message || 'Failed to submit request. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in space-y-8">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-primary/10 border border-accent-primary/20 text-accent-primary text-xs font-semibold">
          <ShieldCheck className="w-4 h-4" />
          <span>Creator Protection & Compliance</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-text-primary tracking-tight">
          Content Takedown <span className="gradient-text">& Copyright Portal</span>
        </h1>
        <p className="text-sm text-text-secondary leading-relaxed">
          FocusLearn respects creators and copyright owners. We never host video files; all
          content is embedded via YouTube&apos;s official IFrame Player API. If you are a channel
          owner and wish to remove your playlist from FocusLearn, submit your request below.
        </p>
      </div>

      {/* Main Grid: Form + Policies */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Column (2 Cols) */}
        <div className="lg:col-span-2">
          {submittedData ? (
            <Card
              padding="lg"
              className="border-accent-success/30 bg-accent-success/5 text-center py-10 space-y-4"
            >
              <div className="w-16 h-16 rounded-full bg-accent-success/20 text-accent-success flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-text-primary">
                Takedown Request Submitted
              </h3>
              <p className="text-sm text-text-secondary max-w-md mx-auto">
                {submittedData.message}
              </p>
              <div className="p-3 bg-bg-secondary rounded-xl border border-border-default text-xs font-mono text-text-secondary inline-block">
                Reference ID: <strong className="text-text-primary">{submittedData.takedown?.id}</strong>
              </div>
              <div>
                <Button variant="secondary" size="sm" onClick={() => setSubmittedData(null)}>
                  Submit Another Request
                </Button>
              </div>
            </Card>
          ) : (
            <Card padding="lg">
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="text-lg font-bold text-text-primary mb-1">
                  Request Content Removal
                </h3>
                <p className="text-xs text-text-tertiary mb-4">
                  Please provide sufficient details to verify your ownership of the content.
                </p>

                {submitError && (
                  <div className="p-3 rounded-xl bg-accent-danger/10 border border-accent-danger/30 text-accent-danger text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Full Name / Representative"
                    placeholder="e.g. Jane Doe"
                    value={formData.requesterName}
                    onChange={(e) =>
                      setFormData({ ...formData, requesterName: e.target.value })
                    }
                    required
                  />
                  <Input
                    label="Official Email Address"
                    type="email"
                    placeholder="name@creatordomain.com"
                    value={formData.requesterEmail}
                    onChange={(e) =>
                      setFormData({ ...formData, requesterEmail: e.target.value })
                    }
                    required
                  />
                </div>

                <Input
                  label="Official YouTube Channel URL"
                  placeholder="https://www.youtube.com/@channelname"
                  value={formData.channelUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, channelUrl: e.target.value })
                  }
                  required
                />

                <Input
                  label="Playlist / Course URL (Optional)"
                  placeholder="https://www.youtube.com/playlist?list=PL..."
                  value={formData.playlistUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, playlistUrl: e.target.value })
                  }
                />

                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                    Reason for Takedown Request <span className="text-accent-danger">*</span>
                  </label>
                  <textarea
                    rows={4}
                    className="w-full bg-bg-secondary border border-border-default rounded-xl p-3 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent-primary transition-colors"
                    placeholder="Please specify if you are the copyright holder, reasons for removal, or specific preferences..."
                    value={formData.reason}
                    onChange={(e) =>
                      setFormData({ ...formData, reason: e.target.value })
                    }
                    required
                  />
                </div>

                {/* Legal Checkbox */}
                <label className="flex items-start gap-2.5 p-3 rounded-xl bg-bg-tertiary/30 border border-border-subtle cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.declaration}
                    onChange={(e) =>
                      setFormData({ ...formData, declaration: e.target.checked })
                    }
                    className="mt-0.5 accent-accent-primary rounded"
                  />
                  <span className="text-xs text-text-secondary leading-relaxed">
                    I declare under penalty of perjury that I am the copyright owner or authorized
                    to act on behalf of the owner of the content identified above.
                  </span>
                </label>

                <Button
                  type="submit"
                  loading={submitting}
                  icon={Send}
                  className="w-full"
                >
                  Submit Removal Request
                </Button>
              </form>
            </Card>
          )}
        </div>

        {/* Policy & Info Column (1 Col) */}
        <div className="space-y-4">
          <Card padding="md" className="space-y-3">
            <div className="flex items-center gap-2 text-accent-primary">
              <FileCheck className="w-5 h-5" />
              <h4 className="text-sm font-bold text-text-primary">Our Legal Policy</h4>
            </div>
            <ul className="text-xs text-text-secondary space-y-2 list-disc pl-4 leading-relaxed">
              <li>
                FocusLearn streams videos directly via the official YouTube IFrame Embed API.
              </li>
              <li>
                Ad revenue and view counts accrue directly to the creator&apos;s YouTube channel.
              </li>
              <li>
                If video embed permissions are revoked on YouTube Studio, playback stops immediately.
              </li>
            </ul>
          </Card>

          <Card padding="md" className="space-y-3">
            <div className="flex items-center gap-2 text-accent-warm">
              <Clock className="w-5 h-5" />
              <h4 className="text-sm font-bold text-text-primary">Response SLA</h4>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              All legitimate takedown requests are processed within <strong>24 to 48 hours</strong>.
              Upon approval, courses will be deactivated immediately across FocusLearn.
            </p>
          </Card>

          <Card padding="md" className="space-y-3">
            <div className="flex items-center gap-2 text-accent-secondary">
              <Info className="w-5 h-5" />
              <h4 className="text-sm font-bold text-text-primary">YouTube ToS</h4>
            </div>
            <p className="text-xs text-text-tertiary leading-relaxed">
              For more details on YouTube&apos;s developer policies and embed guidelines, refer to the{' '}
              <a
                href="https://www.youtube.com/t/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-primary underline inline-flex items-center gap-0.5"
              >
                YouTube Terms of Service
                <ExternalLink className="w-3 h-3" />
              </a>.
            </p>
          </Card>

          {/* Admin link helper box */}
          <div className="p-3.5 rounded-xl bg-bg-secondary border border-border-default/60 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-text-tertiary">
              <Lock className="w-4 h-4 text-accent-purple shrink-0" />
              <span>Platform Admin?</span>
            </div>
            <Link
              to="/admin/takedowns"
              className="text-accent-purple hover:underline font-semibold flex items-center gap-1"
            >
              Access Review Portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
