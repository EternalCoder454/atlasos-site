"use client";

import { useState } from "react";

/* Copies a command or a checksum. Says so for two seconds, to sighted
   users on the button and to screen readers through the live region. */
export function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* No clipboard (insecure context, or denied): the text is on the
         page to select by hand. */
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={label}
      className="shrink-0 rounded-md border border-line px-2.5 py-1 text-xs font-medium text-text-2 transition-colors hover:border-line-strong hover:text-text"
    >
      <span aria-live="polite">{copied ? "Copied" : "Copy"}</span>
    </button>
  );
}
