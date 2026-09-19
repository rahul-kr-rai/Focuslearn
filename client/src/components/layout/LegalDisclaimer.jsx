import { Info } from 'lucide-react';

/**
 * Persistent legal disclaimer banner.
 * Required for copyright compliance — clarifies that all video
 * content streams via YouTube and remains IP of original creators.
 */
export default function LegalDisclaimer({ compact = false }) {
  if (compact) {
    return (
      <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-accent-primary/5 border border-accent-primary/10">
        <Info className="w-3.5 h-3.5 text-accent-primary mt-0.5 shrink-0" />
        <p className="text-xs text-text-tertiary">
          Videos stream via YouTube. All content remains property of original creators.
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-bg-secondary border border-border-default">
      <div className="p-2 rounded-lg bg-accent-primary/10 shrink-0">
        <Info className="w-4 h-4 text-accent-primary" />
      </div>
      <div>
        <h4 className="text-sm font-medium text-text-primary mb-1">Legal Disclaimer</h4>
        <p className="text-xs text-text-secondary leading-relaxed">
          All video content displayed on FocusLearn is streamed directly through the
          official YouTube IFrame Player API. FocusLearn does not download, host, store,
          or redistribute any video files. All videos remain the intellectual property of
          their respective copyright owners. If you are a content creator and wish to
          have your content removed, please visit our{' '}
          <a href="/takedown" className="text-accent-primary hover:underline">
            Creator Takedown Portal
          </a>
          .
        </p>
      </div>
    </div>
  );
}
