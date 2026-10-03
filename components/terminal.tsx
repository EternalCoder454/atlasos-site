/* A Ghostty window with a short first session. components/motion.tsx types
   it out when it comes into view; the markup here is how it ends, which is
   what reduced motion and no-script visitors see. Screen readers get the
   summary in app/page.tsx instead of a half-typed window.

   Long lines wrap rather than scroll, with the wrapped part kept under the
   command, not under the prompt.

   The commands go in as HTML (escaped) because motion.tsx rewrites them
   as it types: React leaves the inside of dangerouslySetInnerHTML alone,
   so a re-render can't trip over the changed nodes. */
const html = (text: string) => ({
  __html: text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"),
});

const session: [string, string][] = [
  ["gh repo clone you/project && cd project", ""],
  ["mise use node@22", "Node, Python, Go and friends, per project"],
  ["docker compose up -d", "Podman underneath, the commands you know"],
  ["just test", ""],
  ["toolbox enter", "a mutable Fedora when you need dnf"],
  ["atlas", "Homebrew, JetBrains Toolbox, the update channel"],
];

function Prompt() {
  return <span aria-hidden="true" className="mr-[1ch] shrink-0 select-none text-sakura">❯</span>;
}

export function Terminal() {
  return (
    <div className="overflow-hidden rounded-[var(--radius-card)] border border-line bg-[#1e1d2b] shadow-[0_24px_60px_-30px_rgba(10,6,40,0.9)]">
      <div className="flex items-center gap-2 border-b border-white/5 px-4 py-2.5">
        <span className="size-3 rounded-full bg-white/10" />
        <span className="size-3 rounded-full bg-white/10" />
        <span className="size-3 rounded-full bg-white/10" />
        <span className="ml-3 font-mono text-xs text-text-3">ghostty · ~/project</span>
      </div>
      <pre data-terminal aria-hidden="true" className="whitespace-pre-wrap p-5 text-[13px] leading-7 sm:text-sm">
        <code>
          {session.map(([cmd, note]) => (
            <span key={cmd} data-line className="block">
              <span className="flex">
                <Prompt />
                <span data-cmd className="min-w-0 text-text [overflow-wrap:anywhere]" dangerouslySetInnerHTML={html(cmd)} />
              </span>
              {note && (
                <span data-note className="block pl-[2ch] text-text-3">
                  # {note}
                </span>
              )}
            </span>
          ))}
          <span data-line className="flex">
            <Prompt />
            <span
              data-cmd
              className="min-w-0"
              dangerouslySetInnerHTML={{ __html: '<span data-caret aria-hidden="true" class="caret"></span>' }}
            />
          </span>
        </code>
      </pre>
    </div>
  );
}
