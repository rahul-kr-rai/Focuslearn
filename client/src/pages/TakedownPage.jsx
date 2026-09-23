import { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Send,
  ExternalLink,
  Lock,
  Clock,
  FileCheck,
  Info,
  Check,
  X,
  RefreshCw,
} from 'lucide-react';
import { takedownAPI } from '../services/api';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

export default function TakedownPage() {
  const [activeTab, setActiveTab] = useState('submit'); // 'submit' | 'manage'

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

  // Admin / Management state
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  const fetchRequests = async () => {
    try {
      setLoadingRequests(true);
      setActionError(null);
      const res = await takedownAPI.getAll({ status: statusFilter });
      setRequests(res.data.data.requests || []);
    } catch (err) {
      console.error('Failed to fetch requests:', err);
      setActionError('Could not load takedown requests.');
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'manage') {
      fetchRequests();
    }
  }, [activeTab, statusFilter]);

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

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      setActionError(null);
      setActionSuccess(null);
      const res = await takedownAPI.updateStatus(id, {
        status: newStatus,
        adminNotes: `Updated to ${newStatus} via Portal`,
      });
      setActionSuccess(res.data.data.message || `Request marked as ${newStatus}.`);
      fetchRequests();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to update request.');
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

      {/* Tabs */}
      <div className="flex justify-center border-b border-border-default pb-1">
        <div className="flex items-center gap-2 bg-bg-secondary p-1 rounded-xl border border-border-default">
          <button
            onClick={() => setActiveTab('submit')}
            className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'submit'
                ? 'bg-accent-primary text-white shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Submit Takedown Request
          </button>
          <button
            onClick={() => setActiveTab('manage')}
            className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'manage'
                ? 'bg-accent-primary text-white shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Review Portal (Admin)
          </button>
        </div>
      </div>

      {/* ── TAB 1: SUBMISSION FORM ── */}
      {activeTab === 'submit' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Column (2 Cols) */}
          <div className="lg:col-span-2">
            {submittedData ? (
              <Card padding="lg" className="border-accent-success/30 bg-accent-success/5 text-center py-10 space-y-4">
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
          </div>
        </div>
      )}

      {/* ── TAB 2: ADMIN MANAGEMENT VIEW ── */}
      {activeTab === 'manage' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border-default">
            <div>
              <h3 className="text-lg font-bold text-text-primary">Takedown Request Queue</h3>
              <p className="text-xs text-text-secondary">
                Review and approve or reject copyright takedown submissions.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Filter pills */}
              <div className="flex items-center gap-1 p-1 bg-bg-secondary rounded-xl border border-border-default text-xs font-semibold">
                {['pending', 'approved', 'rejected'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-3 py-1 rounded-lg capitalize transition-all ${
                      statusFilter === s
                        ? 'bg-accent-primary text-white shadow-sm'
                        : 'text-text-tertiary hover:text-text-primary'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <Button
                variant="secondary"
                size="sm"
                icon={RefreshCw}
                onClick={fetchRequests}
                loading={loadingRequests}
              >
                Refresh
              </Button>
            </div>
          </div>

          {actionSuccess && (
            <div className="p-3 rounded-xl bg-accent-success/15 border border-accent-success/30 text-accent-success text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{actionSuccess}</span>
            </div>
          )}

          {actionError && (
            <div className="p-3 rounded-xl bg-accent-danger/15 border border-accent-danger/30 text-accent-danger text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          {loadingRequests ? (
            <div className="text-center py-12">
              <RefreshCw className="w-8 h-8 text-accent-primary animate-spin mx-auto mb-2" />
              <p className="text-xs text-text-secondary">Loading requests...</p>
            </div>
          ) : requests.length === 0 ? (
            <Card className="text-center py-12">
              <ShieldCheck className="w-10 h-10 text-accent-success mx-auto mb-2" />
              <h4 className="text-base font-bold text-text-primary">No {statusFilter} requests</h4>
              <p className="text-xs text-text-secondary max-w-sm mx-auto mt-1">
                There are currently no takedown requests with &quot;{statusFilter}&quot; status.
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {requests.map((req) => (
                <Card key={req._id} padding="md" className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-default/60 pb-2">
                    <div>
                      <span className="text-sm font-bold text-text-primary">
                        {req.requesterName}
                      </span>
                      <span className="text-xs text-text-tertiary ml-2">
                        ({req.requesterEmail})
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                          req.status === 'approved'
                            ? 'bg-accent-success/15 text-accent-success border border-accent-success/30'
                            : req.status === 'rejected'
                            ? 'bg-accent-danger/15 text-accent-danger border border-accent-danger/30'
                            : 'bg-accent-warm/15 text-accent-warm border border-accent-warm/30'
                        }`}
                      >
                        {req.status}
                      </span>
                      <span className="text-[11px] text-text-tertiary">
                        {new Date(req.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-text-tertiary block font-semibold">Channel:</span>
                      <a
                        href={req.channelUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent-primary hover:underline truncate block"
                      >
                        {req.channelUrl}
                      </a>
                    </div>
                    {req.playlistUrl && (
                      <div>
                        <span className="text-text-tertiary block font-semibold">Playlist:</span>
                        <a
                          href={req.playlistUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-accent-primary hover:underline truncate block"
                        >
                          {req.playlistUrl}
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="p-2.5 rounded-lg bg-bg-secondary border border-border-subtle text-xs text-text-secondary leading-relaxed">
                    <strong className="text-text-primary block mb-0.5">Reason:</strong>
                    {req.reason}
                  </div>

                  {/* Actions */}
                  {req.status === 'pending' && (
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <Button
                        size="sm"
                        variant="danger"
                        icon={X}
                        onClick={() => handleUpdateStatus(req._id, 'rejected')}
                      >
                        Reject Request
                      </Button>
                      <Button
                        size="sm"
                        variant="primary"
                        icon={Check}
                        onClick={() => handleUpdateStatus(req._id, 'approved')}
                      >
                        Approve & Deactivate Content
                      </Button>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
