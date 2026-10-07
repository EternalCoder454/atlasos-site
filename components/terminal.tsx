/* A Ghostty window on Telamon OS, running a short first session. Every line of
   output is what these commands really print on Telamon OS, recorded in a
   pseudo-terminal from the image itself (the clone from a small public repo,
   renamed), in Ghostty's default colours and the Telamon OS window frame.

   components/motion.tsx types it out when it comes into view; the markup
   here is how it ends, which is what reduced motion and no-script visitors
   see. The window keeps one height, and like a real terminal, older lines
   scroll off the top as new ones arrive. Long lines wrap between words,
   which a terminal wouldn't, but a narrow window stays readable. Screen
   readers get the summary in app/page.tsx instead of a half-typed window.

   The commands go in as HTML (escaped) because motion.tsx rewrites them
   as it types: React leaves the inside of dangerouslySetInnerHTML alone,
   so a re-render can't trip over the changed nodes. */
const html = (text: string) => ({
  __html: text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"),
});

/* The ANSI colours the tools used, in Ghostty's default palette. */
const tones = {
  bold: "font-bold",
  green: "text-[#b5bd68]",
  bright: "text-[#b9ca4a]",
  blue: "text-[#81a2be]",
  cyan: "text-[#8abeb7]",
  gray: "text-[#666666]",
};
type Tone = keyof typeof tones;
type Line = string | (string | [string, Tone])[];

/* `wait`: how long the command runs before it prints (ms); `pace`: between
   its lines; `progress`: mise's download bar, drawn while it runs and
   cleared when it's done, as mise does. */
type Step = { cwd: string; cmd: string; wait: number; pace: number; progress?: string; out: Line[] };

const test = (name: string, ms: string): Line => [[`✔ ${name} `, "green"], [`(${ms}ms)`, "gray"]];
const info = (text: string): Line => [[`ℹ ${text}`, "blue"]];
const recipe = (name: string, arg: string, pad: number, text: string): Line => [
  `    ${name}`,
  ...(arg ? [" ", [arg, "cyan"] as [string, Tone]] : []),
  " ".repeat(pad),
  ["# ", "blue"],
  [text, "blue"],
];

const session: Step[] = [
  {
    cwd: "~",
    cmd: "gh repo clone you/app && cd app",
    wait: 500,
    pace: 140,
    out: [
      "Cloning into 'app'...",
      "remote: Enumerating objects: 160, done.",
      "remote: Counting objects: 100% (45/45), done.",
      "remote: Compressing objects: 100% (16/16), done.",
      "remote: Total 160 (delta 35), reused 32 (delta 29), pack-reused 115 (from 1)",
      "Receiving objects: 100% (160/160), 23.31 KiB | 2.91 MiB/s, done.",
      "Resolving deltas: 100% (81/81), done.",
    ],
  },
  {
    cwd: "~/app",
    cmd: "mise use node@22",
    wait: 1800,
    pace: 80,
    progress: "node@22.23.3",
    out: [
      [["✓", "bright"], " installed 1 tool in 5.5s: ", ["node", "blue"], "@22.23.3"],
      [["mise", "green"], " ", ["~/app/mise.toml", "cyan"], " tools: ", ["node", "blue"], "@22.23.3"],
    ],
  },
  {
    cwd: "~/app",
    cmd: "just test",
    wait: 300,
    pace: 30,
    out: [
      [["npm test", "bold"]],
      "",
      "> app@1.0.0 test",
      "> node --test",
      "",
      test("health check answers", "0.367579"),
      test("signs a session", "0.083073"),
      test("rejects a bad token", "0.049798"),
      info("tests 3"),
      info("suites 0"),
      info("pass 3"),
      info("fail 0"),
      info("cancelled 0"),
      info("skipped 0"),
      info("todo 0"),
      info("duration_ms 35.780074"),
    ],
  },
  {
    cwd: "~/app",
    cmd: "docker compose up -d",
    wait: 900,
    pace: 70,
    out: [
      "09f1cebdbddf5d5c6e7521bd66e488a55bc11c47736572c101d9d0cf628121d0",
      "79bd7c99e923138f136f8009d6bffa66e21e9d4fda5c0c561b00fc9c90cfe537",
      "86515736a6b5678a665c4956ffb8c53e44a2c25db2e675c164671f61750238fd",
      "6ca5a55d924212c2689341a84303c306ff86d709a0cd5f22eb438fda6b5717ba",
      "364f4fdeef970ec9806141c18a063cdba0f9a666384c6660c79f7c9d47dbe943",
      "app_db_1",
      "app_cache_1",
    ],
  },
  {
    cwd: "~/app",
    cmd: "atlas",
    wait: 200,
    pace: 25,
    out: [
      "AtlasOS commands (atlas <command>):",
      recipe("info", "", 14, "Which AtlasOS this computer runs, and the image it updates from"),
      recipe("channel", "name", 6, "Follow the stable or testing channel, from the next restart"),
      recipe("brew", "", 14, "Install Homebrew, for command-line tools Fedora doesn't package"),
      recipe("devcontainers", "", 5, "Let VS Code's Dev Containers and other Docker tools use Podman"),
      recipe("distroshelf", "", 7, "Install DistroShelf, an app for your Distrobox containers"),
      recipe("jetbrains-toolbox", "", 1, "Install JetBrains Toolbox, which installs and updates JetBrains IDEs"),
      recipe("pin", "action", 8, "Sign-in PIN for the login and lock screens: set, remove or status"),
    ],
  },
];

/* The prompt Telamon OS's bash shows, all in green. */
function Prompt({ cwd }: { cwd: string }) {
  return <span className="select-none text-[#b5bd68]">you@atlasos:{cwd}$ </span>;
}

function Output({ line }: { line: Line }) {
  const parts = typeof line === "string" ? [line] : line;
  return (
    <div data-out>
      {parts.map((p, i) => (typeof p === "string" ? p : <span key={i} className={tones[p[1]]}>{p[0]}</span>))}
      {/* an empty line keeps its height */}
      {parts.every((p) => p === "") && "​"}
    </div>
  );
}

/* KDE's window buttons, as the Telamon OS window frame draws them. */
function Buttons() {
  const path = ["M4 6.5 8 10.5 12 6.5", "M4 10 8 6 12 10", "M4.5 4.5 11.5 11.5M11.5 4.5 4.5 11.5"];
  return (
    <span className="flex gap-3 text-[#eeecfa]/80">
      {path.map((d) => (
        <svg key={d} viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.3">
          <path d={d} />
        </svg>
      ))}
    </span>
  );
}

export function Terminal() {
  const last = session[session.length - 1].cwd;
  return (
    <div className="overflow-hidden rounded-md border border-white/10 bg-[#282c34] shadow-[0_24px_60px_-30px_rgba(10,6,40,0.9)]">
      <div className="flex items-center gap-2 bg-[#2b2748] px-2.5 py-1.5 text-[#eeecfa]">
        <svg viewBox="0 0 16 16" className="size-4 shrink-0" aria-hidden="true">
          <rect x="1" y="2" width="14" height="12" rx="2.5" fill="#282c34" stroke="#8a7af4" />
          <path d="M4 6l2.5 2L4 10M8 10.5h4" fill="none" stroke="#eeecfa" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
        <span data-title className="flex-1 truncate text-[13px]">
          {last}
        </span>
        <Buttons />
      </div>
      <pre
        data-terminal
        aria-hidden="true"
        className="flex h-[24rem] flex-col justify-end overflow-hidden whitespace-pre-wrap break-words px-3 py-2 font-mono text-[12px] leading-[1.45] text-white sm:h-[28rem] sm:text-[13.5px]"
      >
        {/* At least the window's height, so a short session starts at the
            top; past it, the bottom stays in view and the top scrolls off. */}
        <code className="block min-h-full shrink-0">
          {session.map((s) => (
            <div key={s.cmd} data-step data-cwd={s.cwd} data-wait={s.wait} data-pace={s.pace} data-download={s.progress}>
              <div data-line>
                <Prompt cwd={s.cwd} />
                <span data-cmd dangerouslySetInnerHTML={html(s.cmd)} />
              </div>
              {s.out.map((line, i) => (
                <Output key={i} line={line} />
              ))}
            </div>
          ))}
          <div data-step data-cwd={last}>
            <div data-line>
              <Prompt cwd={last} />
              <span
                data-cmd
                dangerouslySetInnerHTML={{ __html: '<span data-caret aria-hidden="true" class="caret caret-block"></span>' }}
              />
            </div>
          </div>
        </code>
      </pre>
    </div>
  );
}
