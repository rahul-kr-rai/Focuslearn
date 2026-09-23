import React from 'react';

/**
 * Lightweight and secure Markdown renderer for study notes.
 * Supports headings, bold, italics, inline code, code blocks, lists, and line breaks.
 */
export default function MarkdownViewer({ content, className = '' }) {
  if (!content) return null;

  const lines = content.split('\n');
  const elements = [];
  let inCodeBlock = false;
  let codeBlockBuffer = [];

  const parseInline = (text) => {
    // Regex matches inline code `code`, bold **text**, italic *text*
    const parts = [];
    let remaining = text;
    let keyIdx = 0;

    while (remaining.length > 0) {
      // Inline code
      const codeMatch = remaining.match(/^`([^`]+)`/);
      if (codeMatch) {
        parts.push(
          <code
            key={keyIdx++}
            className="px-1.5 py-0.5 rounded bg-bg-tertiary text-accent-secondary text-xs font-mono"
          >
            {codeMatch[1]}
          </code>
        );
        remaining = remaining.slice(codeMatch[0].length);
        continue;
      }

      // Bold
      const boldMatch = remaining.match(/^\*\*([^*]+)\*\*/);
      if (boldMatch) {
        parts.push(
          <strong key={keyIdx++} className="font-semibold text-text-primary">
            {boldMatch[1]}
          </strong>
        );
        remaining = remaining.slice(boldMatch[0].length);
        continue;
      }

      // Italic
      const italicMatch = remaining.match(/^\*([^*]+)\*/);
      if (italicMatch) {
        parts.push(
          <em key={keyIdx++} className="italic text-text-secondary">
            {italicMatch[1]}
          </em>
        );
        remaining = remaining.slice(italicMatch[0].length);
        continue;
      }

      // Timestamp tag like [02:30]
      const timeMatch = remaining.match(/^\[(\d{1,2}:\d{2}(?::\d{2})?)\]/);
      if (timeMatch) {
        parts.push(
          <span
            key={keyIdx++}
            className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-mono font-medium bg-accent-primary/15 text-accent-primary border border-accent-primary/30"
          >
            {timeMatch[1]}
          </span>
        );
        remaining = remaining.slice(timeMatch[0].length);
        continue;
      }

      // Next plain character
      const nextSpecial = remaining.search(/[`*\[]/);
      if (nextSpecial === -1) {
        parts.push(remaining);
        break;
      } else if (nextSpecial === 0) {
        // Unmatched character, consume 1 char
        parts.push(remaining[0]);
        remaining = remaining.slice(1);
      } else {
        parts.push(remaining.slice(0, nextSpecial));
        remaining = remaining.slice(nextSpecial);
      }
    }

    return parts;
  };

  lines.forEach((line, index) => {
    // Check code blocks ```
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        // Close code block
        elements.push(
          <pre
            key={`code-${index}`}
            className="p-3 my-2 rounded-lg bg-black/50 border border-border-default text-xs font-mono text-cyan-300 overflow-x-auto"
          >
            <code>{codeBlockBuffer.join('\n')}</code>
          </pre>
        );
        codeBlockBuffer = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      return;
    }

    if (inCodeBlock) {
      codeBlockBuffer.push(line);
      return;
    }

    // Headings
    if (line.startsWith('### ')) {
      elements.push(
        <h4 key={index} className="text-sm font-bold text-text-primary mt-2 mb-1">
          {parseInline(line.slice(4))}
        </h4>
      );
      return;
    }
    if (line.startsWith('## ')) {
      elements.push(
        <h3 key={index} className="text-base font-bold text-text-primary mt-3 mb-1">
          {parseInline(line.slice(3))}
        </h3>
      );
      return;
    }
    if (line.startsWith('# ')) {
      elements.push(
        <h2 key={index} className="text-lg font-bold text-text-primary mt-3 mb-1">
          {parseInline(line.slice(2))}
        </h2>
      );
      return;
    }

    // Unordered lists
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      elements.push(
        <li key={index} className="ml-4 list-disc text-sm text-text-primary my-0.5 leading-relaxed">
          {parseInline(line.trim().slice(2))}
        </li>
      );
      return;
    }

    // Empty lines
    if (!line.trim()) {
      elements.push(<div key={index} className="h-1.5" />);
      return;
    }

    // Normal paragraph line
    elements.push(
      <p key={index} className="text-sm text-text-primary leading-relaxed">
        {parseInline(line)}
      </p>
    );
  });

  // If unclosed code block at end of content
  if (inCodeBlock && codeBlockBuffer.length > 0) {
    elements.push(
      <pre
        key="code-unclosed"
        className="p-3 my-2 rounded-lg bg-black/50 border border-border-default text-xs font-mono text-cyan-300 overflow-x-auto"
      >
        <code>{codeBlockBuffer.join('\n')}</code>
      </pre>
    );
  }

  return <div className={`space-y-1 ${className}`}>{elements}</div>;
}
