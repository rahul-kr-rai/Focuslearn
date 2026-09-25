import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Clock,
  RefreshCw,
  Search,
  Filter,
  Check,
  X,
  FileText,
  Mail,
  Video,
  Layers,
  ArrowUpRight,
  MessageSquare,
  Lock,
} from 'lucide-react';
import { takedownAPI } from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

export default function AdminReviewPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending'); // 'all' | 'pending' | 'approved' | 'rejected'
  const [searchQuery, setSearchQuery] = useState('');
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [actionInProgress, setActionInProgress] = useState({});

  // Dialog state for approval/rejection notes
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    request: null,
    targetStatus: null, // 'approved' | 'rejected'
    adminNotes: '',
  });

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      setActionError(null);
      const params = {};
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      const res = await takedownAPI.getAll(params);
      setRequests(res.data?.data?.requests || []);
    } catch (err) {
      console.error('Failed to fetch takedown review requests:', err);
      setActionError('Could not load takedown requests. Please check your admin privileges.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleOpenActionModal = (request, targetStatus) => {
    setConfirmDialog({
      isOpen: true,
      request,
      targetStatus,
      adminNotes:
        targetStatus === 'approved'
          ? 'Approved after copyright ownership verification.'
          : 'Rejected: Unable to verify ownership or non-infringing usage.',
    });
  };

  const handleConfirmAction = async () => {
    const { request, targetStatus, adminNotes } = confirmDialog;
    if (!request || !targetStatus) return;

    try {
      setActionInProgress((prev) => ({ ...prev, [request._id]: true }));
      setActionError(null);
      setActionSuccess(null);

      const res = await takedownAPI.updateStatus(request._id, {
        status: targetStatus,
        adminNotes: adminNotes.trim(),
      });

      const message =
        res.data?.data?.message ||
        `Request successfully marked as ${targetStatus}.`;

      setActionSuccess(message);
      setConfirmDialog({ isOpen: false, request: null, targetStatus: null, adminNotes: '' });
      fetchRequests();
    } catch (err) {
      console.error('Failed to update takedown status:', err);
      setActionError(err.response?.data?.message || 'Failed to update request status.');
    } finally {
      setActionInProgress((prev) => ({ ...prev, [request._id]: false }));
    }
  };

  // Filter requests locally by search query
  const filteredRequests = useMemo(() => {
    if (!searchQuery.trim()) return requests;
    const query = searchQuery.toLowerCase();
    return requests.filter(
      (req) =>
        req.requesterName?.toLowerCase().includes(query) ||
        req.requesterEmail?.toLowerCase().includes(query) ||
        req.channelUrl?.toLowerCase().includes(query) ||
        req.playlistUrl?.toLowerCase().includes(query) ||
        req.reason?.toLowerCase().includes(query)
    );
  }, [requests, searchQuery]);

  // Counts for quick metrics
  const stats = useMemo(() => {
    return {
      total: requests.length,
      pending: requests.filter((r) => r.status === 'pending').length,
      approved: requests.filter((r) => r.status === 'approved').length,
      rejected: requests.filter((r) => r.status === 'rejected').length,
    };
  }, [requests]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in space-y-8">
      {/* Top Banner / Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-default pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-purple/10 border border-accent-purple/20 text-accent-purple text-xs font-semibold mb-2">
            <Lock className="w-3.5 h-3.5" />
            <span>Staff Administration Console</span>
          </div>
          <h1 className="text-3xl font-black text-text-primary tracking-tight">
            Takedown <span className="gradient-text">Review Portal</span>
          </h1>
          <p className="text-sm text-text-secondary mt-1 max-w-2xl">
            Review and adjudicate copyright removal submissions. Approving a request automatically deactivates matching courses across FocusLearn.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            to="/takedown"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium text-text-secondary hover:text-accent-primary bg-bg-secondary border border-border-default hover:border-accent-primary/40 transition-colors"
          >
            <span>View Public Form</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            onClick={fetchRequests}
            loading={loading}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="sm" className="space-y-1">
          <div className="flex items-center justify-between text-text-tertiary">
            <span className="text-xs font-medium">Active Filter</span>
            <Layers className="w-4 h-4" />
          </div>
          <p className="text-2xl font-bold text-text-primary capitalize">{statusFilter}</p>
          <p className="text-[11px] text-text-tertiary">{filteredRequests.length} showing</p>
        </Card>

        <Card padding="sm" className="space-y-1 border-accent-warm/30 bg-accent-warm/5">
          <div className="flex items-center justify-between text-accent-warm">
            <span className="text-xs font-medium">Pending Review</span>
            <Clock className="w-4 h-4" />
          </div>
          <p className="text-2xl font-bold text-accent-warm">
            {statusFilter === 'pending' ? requests.length : stats.pending}
          </p>
          <p className="text-[11px] text-text-tertiary">Awaiting adjudication</p>
        </Card>

        <Card padding="sm" className="space-y-1 border-accent-success/30 bg-accent-success/5">
          <div className="flex items-center justify-between text-accent-success">
            <span className="text-xs font-medium">Approved / Deactivated</span>
            <ShieldCheck className="w-4 h-4" />
          </div>
          <p className="text-2xl font-bold text-accent-success">
            {statusFilter === 'approved' ? requests.length : stats.approved}
          </p>
          <p className="text-[11px] text-text-tertiary">Courses taken down</p>
        </Card>

        <Card padding="sm" className="space-y-1 border-accent-danger/30 bg-accent-danger/5">
          <div className="flex items-center justify-between text-accent-danger">
            <span className="text-xs font-medium">Rejected</span>
            <X className="w-4 h-4" />
          </div>
          <p className="text-2xl font-bold text-accent-danger">
            {statusFilter === 'rejected' ? requests.length : stats.rejected}
          </p>
          <p className="text-[11px] text-text-tertiary">Dismissed claims</p>
        </Card>
      </div>

      {/* Action Notifications */}
      {actionSuccess && (
        <div className="p-4 rounded-xl bg-accent-success/15 border border-accent-success/30 text-accent-success text-sm flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button
            onClick={() => setActionSuccess(null)}
            className="text-accent-success/70 hover:text-accent-success text-xs font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {actionError && (
        <div className="p-4 rounded-xl bg-accent-danger/15 border border-accent-danger/30 text-accent-danger text-sm flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button
            onClick={() => setActionError(null)}
            className="text-accent-danger/70 hover:text-accent-danger text-xs font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-bg-secondary/60 p-3 rounded-xl border border-border-default">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs text-text-tertiary font-semibold flex items-center gap-1 mr-1 shrink-0">
            <Filter className="w-3.5 h-3.5" />
            Status:
          </span>
          {[
            { id: 'pending', label: 'Pending' },
            { id: 'approved', label: 'Approved' },
            { id: 'rejected', label: 'Rejected' },
            { id: 'all', label: 'All Requests' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === tab.id
                  ? 'bg-accent-primary text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-text-tertiary absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search requester, email, URL..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-bg-primary border border-border-default rounded-lg text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent-primary transition-colors"
          />
        </div>
      </div>

      {/* Queue List */}
      {loading ? (
        <div className="text-center py-16 space-y-3">
          <RefreshCw className="w-10 h-10 text-accent-primary animate-spin mx-auto" />
          <p className="text-sm text-text-secondary">Loading review queue...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <Card className="text-center py-16 space-y-3">
          <ShieldCheck className="w-12 h-12 text-accent-success/80 mx-auto" />
          <h3 className="text-lg font-bold text-text-primary">
            No {statusFilter !== 'all' ? statusFilter : ''} takedown requests found
          </h3>
          <p className="text-xs text-text-secondary max-w-md mx-auto">
            {searchQuery
              ? 'No requests match your current search query. Try clearing the filter.'
              : `The ${statusFilter} queue is currently clear.`}
          </p>
          {searchQuery && (
            <Button variant="secondary" size="sm" onClick={() => setSearchQuery('')}>
              Clear Search Filter
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((req) => {
            const isActing = actionInProgress[req._id];

            return (
              <Card
                key={req._id}
                padding="md"
                className={`space-y-4 transition-all duration-200 ${
                  req.status === 'pending'
                    ? 'border-accent-warm/40 bg-bg-secondary'
                    : 'bg-bg-secondary/70'
                }`}
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-default pb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        req.status === 'approved'
                          ? 'bg-accent-success/15 text-accent-success'
                          : req.status === 'rejected'
                          ? 'bg-accent-danger/15 text-accent-danger'
                          : 'bg-accent-warm/15 text-accent-warm'
                      }`}
                    >
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-text-primary">
                        {req.requesterName}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-text-tertiary">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          <a
                            href={`mailto:${req.requesterEmail}`}
                            className="hover:text-accent-primary transition-colors"
                          >
                            {req.requesterEmail}
                          </a>
                        </span>
                        <span>•</span>
                        <span>
                          {new Date(req.createdAt).toLocaleString(undefined, {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[11px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full ${
                        req.status === 'approved'
                          ? 'bg-accent-success/15 text-accent-success border border-accent-success/30'
                          : req.status === 'rejected'
                          ? 'bg-accent-danger/15 text-accent-danger border border-accent-danger/30'
                          : 'bg-accent-warm/15 text-accent-warm border border-accent-warm/30'
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>
                </div>

                {/* Target Links & Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-bg-primary/50 p-3 rounded-lg border border-border-subtle">
                  <div className="space-y-1">
                    <span className="text-text-tertiary font-semibold flex items-center gap-1">
                      <Video className="w-3.5 h-3.5 text-accent-danger" />
                      Claimed Channel URL:
                    </span>
                    <a
                      href={req.channelUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent-primary hover:underline inline-flex items-center gap-1 break-all"
                    >
                      {req.channelUrl}
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  </div>

                  <div className="space-y-1">
                    <span className="text-text-tertiary font-semibold flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-accent-secondary" />
                      Target Playlist URL:
                    </span>
                    {req.playlistUrl ? (
                      <a
                        href={req.playlistUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent-primary hover:underline inline-flex items-center gap-1 break-all"
                      >
                        {req.playlistUrl}
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    ) : (
                      <span className="text-text-secondary italic">
                        Entire Channel Scope (No specific playlist specified)
                      </span>
                    )}
                  </div>
                </div>

                {/* Stated Reason */}
                <div className="space-y-1 text-xs">
                  <span className="text-text-tertiary font-semibold flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" />
                    Requester Legal Claim & Reason:
                  </span>
                  <div className="p-3 rounded-lg bg-bg-tertiary/30 border border-border-subtle text-text-primary leading-relaxed whitespace-pre-wrap">
                    {req.reason}
                  </div>
                </div>

                {/* Admin Notes if present */}
                {req.adminNotes && (
                  <div className="space-y-1 text-xs">
                    <span className="text-text-tertiary font-semibold flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5 text-accent-purple" />
                      Admin Adjudication Notes:
                    </span>
                    <div className="p-2.5 rounded-lg bg-accent-purple/5 border border-accent-purple/20 text-text-secondary italic">
                      {req.adminNotes}
                    </div>
                  </div>
                )}

                {/* Action Buttons for Pending Requests */}
                {req.status === 'pending' && (
                  <div className="flex items-center justify-end gap-3 pt-2 border-t border-border-default/60">
                    <Button
                      size="sm"
                      variant="danger"
                      icon={X}
                      loading={isActing}
                      onClick={() => handleOpenActionModal(req, 'rejected')}
                    >
                      Reject Claim
                    </Button>
                    <Button
                      size="sm"
                      variant="primary"
                      icon={Check}
                      loading={isActing}
                      onClick={() => handleOpenActionModal(req, 'approved')}
                    >
                      Approve & Deactivate Content
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <Card padding="lg" className="w-full max-w-lg space-y-4 border-border-default shadow-xl">
            <div className="flex items-center justify-between border-b border-border-default pb-3">
              <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                {confirmDialog.targetStatus === 'approved' ? (
                  <>
                    <ShieldCheck className="w-5 h-5 text-accent-success" />
                    Confirm Approval & Content Deactivation
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-5 h-5 text-accent-danger" />
                    Confirm Claim Rejection
                  </>
                )}
              </h3>
              <button
                onClick={() =>
                  setConfirmDialog({
                    isOpen: false,
                    request: null,
                    targetStatus: null,
                    adminNotes: '',
                  })
                }
                className="text-text-tertiary hover:text-text-primary p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-text-secondary leading-relaxed">
              {confirmDialog.targetStatus === 'approved' ? (
                <>
                  Approving this takedown request will mark the submission as{' '}
                  <strong className="text-accent-success font-semibold">Approved</strong> and
                  automatically deactivate any active FocusLearn courses linked to this playlist or
                  channel.
                </>
              ) : (
                <>
                  Rejecting this claim will mark the submission as{' '}
                  <strong className="text-accent-danger font-semibold">Rejected</strong>. No
                  courses will be altered.
                </>
              )}
            </p>

            <div className="p-3 rounded-lg bg-bg-primary/60 border border-border-subtle text-xs space-y-1">
              <div>
                <span className="text-text-tertiary">Requester: </span>
                <strong className="text-text-primary">{confirmDialog.request?.requesterName}</strong>{' '}
                ({confirmDialog.request?.requesterEmail})
              </div>
              <div className="truncate">
                <span className="text-text-tertiary">Channel: </span>
                <span className="text-accent-primary">{confirmDialog.request?.channelUrl}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                Admin Adjudication Note
              </label>
              <textarea
                rows={3}
                value={confirmDialog.adminNotes}
                onChange={(e) =>
                  setConfirmDialog({ ...confirmDialog, adminNotes: e.target.value })
                }
                placeholder="Add explanatory notes for compliance audit logs..."
                className="w-full bg-bg-primary border border-border-default rounded-xl p-2.5 text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent-primary transition-colors"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  setConfirmDialog({
                    isOpen: false,
                    request: null,
                    targetStatus: null,
                    adminNotes: '',
                  })
                }
              >
                Cancel
              </Button>
              <Button
                variant={confirmDialog.targetStatus === 'approved' ? 'primary' : 'danger'}
                size="sm"
                onClick={handleConfirmAction}
              >
                {confirmDialog.targetStatus === 'approved'
                  ? 'Confirm Approval'
                  : 'Confirm Rejection'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
