"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/* A Copy button on each code block of the article. The blocks are HTML the
   server rendered from Markdown, so the buttons are added here rather than
   in it, again on every navigation (client navigation keeps this
   component). Without script, the code is there to select by hand. */
export function CopyCode() {
  const path = usePathname();
  useEffect(() => {
    const timers: number[] = [];
    const added: HTMLButtonElement[] = [];
    for (const pre of document.querySelectorAll<HTMLPreElement>("[data-docs-article] .code-block > pre.code")) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "copy-code";
      button.textContent = "Copy";
      button.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(pre.querySelector("code")?.innerText ?? "");
          button.textContent = "Copied";
          button.dataset.copied = "";
          timers.push(
            window.setTimeout(() => {
              button.textContent = "Copy";
              delete button.dataset.copied;
            }, 2000),
          );
        } catch {
          // No clipboard (insecure context, or denied): the code selected,
          // for Ctrl+C.
          const code = pre.querySelector("code");
          const sel = window.getSelection();
          if (code && sel) {
            sel.selectAllChildren(code);
            button.textContent = "Press Ctrl+C";
            timers.push(window.setTimeout(() => (button.textContent = "Copy"), 3000));
          }
        }
      });
      pre.parentElement?.append(button);
      added.push(button);
    }
    return () => {
      timers.forEach(clearTimeout);
      added.forEach((b) => b.remove());
    };
  }, [path]);
  return null;
}
