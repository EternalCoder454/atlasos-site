import { Download } from "@/components/download";
import { MemoryBars } from "@/components/memory-bars";
import { Lightbox } from "@/components/lightbox";
import { Motion } from "@/components/motion";
import { Screenshot } from "@/components/screenshot";
import { Horizon, Orbits, Starfield } from "@/components/space";
import { Terminal } from "@/components/terminal";
import { currentReleases } from "@/lib/releases";
import { links, site } from "@/lib/site";

/* Rendered per request, so the download section shows the ISO that's up
   now. Prerendering would bake in whatever the image build saw, and the
   build has no ISOs. The two small JSON reads behind it are cached
   (lib/releases.ts), so this costs a few milliseconds. */
export const dynamic = "force-dynamic";

const link = "text-violet-hi underline decoration-violet-hi/40 underline-offset-4 hover:decoration-violet-hi";

function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-line/70 bg-ink-0/85 backdrop-blur-md">
      <div className="wrap flex h-16 items-center justify-between gap-6">
        <a href="#top" className="flex items-center gap-2.5 font-semibold tracking-tight">
          {/* eslint-disable-next-line @next/next/no-img-element -- a 3 KB SVG */}
          <img src="/brand/atlas-mark.svg" alt="" width={28} height={28} className="size-7" />
          <span className="whitespace-nowrap">
            AtlasOS <span className="font-normal text-text-3 max-[359px]:hidden">Linux</span>
          </span>
        </a>
        <nav aria-label="Main" className="flex items-center gap-1 text-sm sm:gap-2">
          <a href="#tools" className="hidden rounded-md px-3 py-2 text-text-2 hover:text-text md:block">Tools</a>
          <a href="#updates" className="hidden rounded-md px-3 py-2 text-text-2 hover:text-text md:block">Updates</a>
          <a href="#looks" className="hidden rounded-md px-3 py-2 text-text-2 hover:text-text md:block">Looks</a>
          <a href={site.repo} className="rounded-md px-3 py-2 text-text-2 hover:text-text">GitHub</a>
          <a href="#download" className="rounded-lg bg-violet-deep px-4 py-2 font-semibold text-white hover:bg-violet">
            Download
          </a>
        </nav>
      </div>
      {/* How far down the page you are (components/motion.tsx). */}
      <div
        data-progress
        aria-hidden="true"
        className="absolute inset-x-0 -bottom-px h-px origin-left bg-linear-to-r from-violet-deep via-violet-hi to-sakura"
        style={{ transform: "scaleX(0)" }}
      />
    </header>
  );
}

const heroWords = ["build things.", "write code.", "ship software.", "self-host.", "tinker."];

function Hero() {
  return (
    <section id="top" className="relative isolate overflow-hidden pb-20 pt-16 sm:pt-24">
      <Starfield meteors />
      {/* The wallpaper's two colours, as light behind the screenshot. */}
      <div
        data-glow
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[22rem] h-[36rem] w-[64rem] -translate-x-1/2 rounded-full opacity-35 blur-3xl"
        style={{ background: "radial-gradient(closest-side, #6858e2, transparent), radial-gradient(closest-side at 70% 60%, #f7a8d2, transparent)" }}
      />
      <div className="wrap hero-in relative">
        {/* The last words are typed and retyped (components/motion.tsx), on
            a line of their own so the rest never reflows. Screen readers
            get the sentence once. */}
        <h1 className="max-w-3xl text-4xl font-semibold leading-[1.08] tracking-tight text-balance sm:text-6xl">
          <span className="sr-only">The Linux desktop for people who build things.</span>
          <span aria-hidden="true">
            The Linux desktop for people who
            <span className="block whitespace-nowrap text-violet-hi">
              {/* Retyped by motion.tsx, so not React's to reconcile. */}
              <span data-words={JSON.stringify(heroWords)} dangerouslySetInnerHTML={{ __html: heroWords[0] }} />
              <span className="caret [--caret-width:0.07em]" />
            </span>
          </span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-text-2 sm:text-xl">
          Fedora and KDE Plasma, tuned and trimmed. Your tools come installed, updates wait until
          you&apos;re ready, and a bad one rolls itself back.
        </p>
        <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-4">
          <a href="#download" className="rounded-xl bg-violet-deep px-6 py-3.5 font-semibold text-white transition-colors hover:bg-violet">
            Download the ISO
          </a>
          <a href="#switch" className="font-medium text-text-2 hover:text-text">
            Or switch from Fedora Atomic <span aria-hidden="true">→</span>
          </a>
        </div>
        <p className="mt-5 text-sm text-text-3">
          AtlasOS Linux is its own project, not related to AtlasOS for Windows.
        </p>

        <figure className="relative mt-14 sm:mt-16">
          <Horizon />
          <div data-tilt className="origin-bottom overflow-hidden rounded-[var(--radius-card)] border border-line-strong/60 shadow-[0_30px_80px_-30px_rgba(10,6,40,0.9)]">
            <Screenshot
              name="desktop"
              priority
              sizes="(min-width: 72rem) 1104px, calc(100vw - 2rem)"
              alt="The AtlasOS desktop, cut diagonally into AtlasOS Light on the left and AtlasOS Dark on the right: the menu bar on top, the floating dock at the bottom, and Atlas Notepad and Ghostty open over the sakura wallpaper."
            />
          </div>
          <figcaption className="mt-3 text-sm text-text-3">
            The menu bar on top, the dock at the bottom, in AtlasOS Light and Dark.
          </figcaption>
        </figure>
      </div>
    </section>
  );
}

function Tools() {
  return (
    <section id="tools" aria-labelledby="tools-title" className="border-t border-line py-20 sm:py-28">
      <div className="wrap grid grid-cols-1 items-start gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-16">
        <div data-reveal-children>
          <h2 id="tools-title" className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Open a terminal and start.
          </h2>
          <p className="mt-4 text-lg text-text-2">
            No afternoon of setup on a new machine. What you&apos;d install first is already there,
            and the system itself stays out of your way.
          </p>
          <dl className="mt-8 space-y-5">
            {[
              ["Terminal", <><b className="font-semibold text-text">Ghostty</b> on Ctrl+Alt+T, and &ldquo;Open Terminal Here&rdquo; in Dolphin.</>],
              ["Containers", <>Podman with a <code className="text-sm">docker</code> command and compose. Toolbox and Distrobox for mutable environments.</>],
              ["Runtimes", <><a className={link} href="https://mise.jdx.dev">mise</a> for Node, Python, Go and the rest.</>],
              ["Command line", <>git, gh, just, jq, ripgrep, fd, gdb, strace and perf, with Atlas Monitor in place of btop.</>],
              ["Editing", <>Atlas Notepad as the text editor, with file watch limits raised for big projects.</>],
              ["Everything else", <><code className="text-sm">atlas</code>, a menu for Homebrew, Docker tools on Podman and JetBrains Toolbox. <a className={link} href={links.software}>Where software goes</a>.</>],
            ].map(([term, text]) => (
              <div key={term as string} className="grid gap-1 sm:grid-cols-[8.5rem_1fr] sm:gap-4">
                <dt className="font-mono text-sm text-violet-hi sm:pt-0.5">{term}</dt>
                <dd className="text-text-2">{text}</dd>
              </div>
            ))}
          </dl>
        </div>

        <figure data-reveal className="lg:sticky lg:top-24">
          <Terminal />
          <p className="sr-only">
            A terminal session on AtlasOS: clone a project with gh, install Node 22 with mise, run the
            tests with just, start Postgres and Valkey with docker compose, and list the atlas menu.
          </p>
          <figcaption className="mt-3 text-sm text-text-3">All of it there on first boot, nothing to add.</figcaption>
        </figure>
      </div>
    </section>
  );
}

const updateSteps = [
  ["Downloads while you work", "Atlas Updater sits in the tray and fetches the next version in the background. The whole system is one tested, signed image, updated in one piece."],
  ["Restarts when you say", "Restart now or pick a time. See what's new before you do, and update your Flatpak apps from the same window."],
  ["Goes back in one click", "Don't like an update? Go Back returns you to the previous version, which is always kept."],
  ["Rolls itself back", "If a new version fails its startup checks, AtlasOS boots the last good one on its own, and won't download that version again."],
];

function Updates() {
  return (
    <section id="updates" aria-labelledby="updates-title" className="border-t border-line bg-ink-1 py-20 sm:py-28">
      <div className="wrap">
        <div data-reveal-children className="max-w-2xl">
          <h2 id="updates-title" className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Updates that wait for you.
          </h2>
          <p className="mt-4 text-lg text-text-2">
            Nothing restarts in the middle of a build. Nothing half-installs. And a bad update
            isn&apos;t your evening.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 items-start gap-12 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)]">
          <div data-reveal className="overflow-hidden rounded-[var(--radius-card)] border border-line">
            <Screenshot
              name="updater-dark"
              sizes="(min-width: 72rem) 600px, (min-width: 64rem) 54vw, calc(100vw - 2rem)"
              alt="Atlas Updater in the dark theme, showing AtlasOS is up to date, with the current, ready and previous versions listed."
            />
          </div>
          {/* Each step's dot sits on the line, centred on its title's first
              line, and the line runs from the first dot to the last. The
              violet is drawn down it as you read, filling each dot as it
              gets there (components/motion.tsx). */}
          <ol data-reveal-children className="space-y-8">
            {updateSteps.map(([title, text], i) => (
              <li key={title} className="relative pl-10">
                {i < updateSteps.length - 1 && (
                  <span aria-hidden="true" className="absolute left-1.5 top-3 h-[calc(100%+2rem)] w-0.5 rounded-full bg-line-strong">
                    <span data-draw className="block size-full origin-top rounded-full bg-violet" />
                  </span>
                )}
                <span aria-hidden="true" className="absolute left-0 top-[5px] flex size-3.5 items-center justify-center rounded-full border-2 border-violet bg-ink-1">
                  <span data-dot className="size-1.5 rounded-full bg-violet-hi" />
                </span>
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-1.5 text-text-2">{text}</p>
              </li>
            ))}
          </ol>
        </div>

        <p data-reveal className="mt-12 max-w-3xl text-text-2">
          Two channels: <b className="font-semibold text-text">Stable</b>, weekly, and{" "}
          <b className="font-semibold text-text">Testing</b>, daily, for the brave. Updates install
          only if they carry the AtlasOS signature.
        </p>
      </div>
    </section>
  );
}

function Numbers() {
  return (
    <section aria-labelledby="numbers-title" className="border-t border-line py-20 sm:py-28">
      <div className="wrap grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <div data-reveal-children>
          <h2 id="numbers-title" className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Half the memory, before you open anything.
          </h2>
          <p className="mt-4 text-lg text-text-2">
            AtlasOS keeps what&apos;s good about Fedora and Plasma and drops what most people never
            use, so your editor, your containers and your browser get the memory instead.
          </p>
          <p className="mt-4 text-text-2">
            The desktop is ready about <b className="font-semibold text-text">8 seconds</b> after
            the kernel starts.{" "}
            <a className={link} href={links.optimization}>How it got there, change by change</a>.
          </p>
        </div>
        <div data-reveal className="rounded-[var(--radius-card)] border border-line bg-ink-1 p-6 sm:p-8">
          <p className="mb-6 text-sm font-medium text-text">Memory in use at idle</p>
          <MemoryBars />
          <p className="mt-6 text-xs text-text-3">An 8 GB virtual machine, two minutes after login.</p>
        </div>
      </div>
    </section>
  );
}

function Looks() {
  return (
    <section id="looks" aria-labelledby="looks-title" className="border-t border-line py-20 sm:py-28">
      <div className="wrap">
        <div data-reveal-children className="max-w-2xl">
          <h2 id="looks-title" className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Looks finished on the first boot.
          </h2>
          <p className="mt-4 text-lg text-text-2">
            Plasma and KWin with AtlasOS&apos;s own style for the desktop and the apps, so nothing
            extra runs in the background to make it look this way.
          </p>
        </div>

        <div data-reveal-children className="mt-12 grid gap-6 md:grid-cols-2">
          <figure>
            <div className="overflow-hidden rounded-[var(--radius-card)] border border-line transition-[translate,box-shadow] duration-500 hover:-translate-y-1 hover:shadow-[0_24px_50px_-28px_rgba(104,88,226,0.6)]">
              <Screenshot
                name="setup-appearance"
                sizes="(min-width: 72rem) 540px, (min-width: 48rem) 46vw, calc(100vw - 2rem)"
                alt="The first-run setup's Appearance page in Dark, choosing between Light and Dark, with a preview of each."
              />
            </div>
            <figcaption className="mt-3 text-sm text-text-3">First-run setup: Light or Dark, both from the logo&apos;s violets.</figcaption>
          </figure>
          <figure>
            <div className="overflow-hidden rounded-[var(--radius-card)] border border-line transition-[translate,box-shadow] duration-500 hover:-translate-y-1 hover:shadow-[0_24px_50px_-28px_rgba(104,88,226,0.6)]">
              <Screenshot
                name="launcher"
                sizes="(min-width: 72rem) 540px, (min-width: 48rem) 46vw, calc(100vw - 2rem)"
                alt="The app launcher over the dock, cut diagonally into AtlasOS Light and Dark, with the favourite apps up front and one search box."
              />
            </div>
            <figcaption className="mt-3 text-sm text-text-3">The launcher, centred over the dock. Its search is the one search.</figcaption>
          </figure>
        </div>

        <ul data-reveal-children className="mt-12 grid gap-x-12 gap-y-3 text-text-2 sm:grid-cols-2">
          {[
            "A menu bar on top, a floating dock below, both see-through and blurred",
            "Rounded windows, soft shadows, acrylic-style menus, and right-click menus that keep every action",
            "Two themes, AtlasOS Light and Dark, and the wallpaper turns to night with Dark",
            "Bibata cursors and Papirus icons, matched to each theme",
            "IBM Plex Sans for the interface, JetBrains Mono for code",
            "Notifications that slide down at the top centre, under the clock",
            "A matching login and lock screen, and its own boot splash",
          ].map((item) => (
            <li key={item} className="flex gap-3">
              <span aria-hidden="true" className="mt-2.5 size-1.5 shrink-0 rounded-full bg-sakura" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* Three separate lists, not two side by side: what's left out isn't
   "replaced" by what's set up, and a two-column layout read that way. */
const leftOut = [
  ["Akonadi", "the database behind KDE's mail and calendar apps"],
  ["Baloo", "the file indexer that runs in the background"],
  ["KDE Connect", "phone pairing"],
  ["Telemetry", "nothing reports home"],
  ["Apps you'd never open", ""],
];
const swapped = [
  ["Konsole", "Ghostty"],
  ["Firefox", "Brave Origin"],
];

function Less() {
  return (
    <section aria-labelledby="less-title" className="border-t border-line py-20 sm:py-28">
      <div className="wrap">
        <div data-reveal-children className="max-w-2xl">
          <h2 id="less-title" className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Less, on purpose.
          </h2>
          <p className="mt-4 text-lg text-text-2">
            No pile of apps you&apos;ll never open, and nothing reporting home. What&apos;s left is
            what you&apos;ll use.
          </p>
        </div>

        <div data-reveal-children className="mt-12 grid gap-6 md:grid-cols-2">
          <div className="rounded-[var(--radius-card)] border border-line bg-ink-1 p-6 md:row-span-2">
            <h3 className="font-semibold">Not installed</h3>
            <ul data-strikes className="mt-4 space-y-3">
              {leftOut.map(([name, what]) => (
                <li key={name}>
                  {/* A drawn line rather than line-through, so it can be crossed off. */}
                  <span className="relative text-text-2">
                    {name}
                    <span data-strike aria-hidden="true" className="absolute inset-x-0 top-[55%] h-px origin-left bg-text-3/80" />
                  </span>
                  {what && <span className="block text-sm text-text-3">{what}</span>}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-[var(--radius-card)] border border-line bg-ink-1 p-6">
            <h3 className="font-semibold">Different picks</h3>
            <ul className="mt-4 space-y-3">
              {swapped.map(([from, to]) => (
                <li key={from} className="flex flex-wrap items-baseline gap-x-2.5 text-text-2">
                  <span className="text-text-3">{from}</span>
                  <span aria-hidden="true" className="text-violet">→</span>
                  <span className="sr-only">swapped for</span>
                  <span className="font-medium text-text">{to}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-[var(--radius-card)] border border-line bg-ink-1 p-6">
            <h3 className="font-semibold">Ready when you need it</h3>
            <ul className="mt-4 space-y-3 text-text-2">
              <li>Flathub, set up, for every other app</li>
              <li>
                Crash reports, off until you turn them on. Then you see each one in full and
                decide whether it goes. <a className={link} href={links.privacy}>Privacy</a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/* What the name is about. Atlas holds up the sky; AtlasOS starts with one
   desk. Honest about the size, open about the aim. */
function Ethos() {
  return (
    <section aria-labelledby="ethos-title" className="relative isolate overflow-hidden border-t border-line py-20 sm:py-28">
      <Starfield />
      <div className="wrap relative grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div data-reveal-children>
          <h2 id="ethos-title" className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Built to hold things up.
          </h2>
          <p className="mt-4 text-lg text-text-2">
            In the old story, Atlas carries the sky. AtlasOS starts smaller: your machine, and the
            work you do on it, every day.
          </p>
          <p className="mt-4 text-text-2">
            So the whole system is one signed image. Every change is tested in a virtual machine
            before it&apos;s ticked off, the last version is always kept, and a version that fails
            its startup checks hands back to the last good one.
          </p>
          <p className="mt-4 text-text-2">
            The aim is to keep earning more weight to carry: a system people can trust with the
            things that hold everything else up.
          </p>
        </div>
        <div data-reveal>
          <Orbits />
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-line py-12 text-sm text-text-3">
      <div className="wrap flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-xl space-y-2">
          <p>
            AtlasOS is a personal project, built on{" "}
            <a className={link} href="https://fedoraproject.org">Fedora</a>,{" "}
            <a className={link} href="https://kde.org">KDE</a> and{" "}
            <a className={link} href="https://bootc-dev.github.io/bootc/">bootc</a>. It&apos;s young:
            keep backups, as you would anyway.
          </p>
          <p>
            Apache-2.0. Not affiliated with Fedora or KDE, and not related to AtlasOS, the Windows
            modification by Atlas-OS.
          </p>
        </div>
        <nav aria-label="Project" className="flex flex-wrap gap-x-6 gap-y-2">
          <a className="hover:text-text" href={site.repo}>Source</a>
          <a className="hover:text-text" href={site.installerRepo}>Installer</a>
          <a className="hover:text-text" href={links.dev}>For developers</a>
          <a className="hover:text-text" href={links.privacy}>Privacy</a>
        </nav>
      </div>
    </footer>
  );
}

export default async function Home() {
  const releases = await currentReleases();
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-ink-2 focus:px-4 focus:py-2">
        Skip to content
      </a>
      <Header />
      <main id="main">
        <Hero />
        <Tools />
        <Updates />
        <Numbers />
        <Looks />
        <Less />
        <Ethos />
        <Download releases={releases} />
      </main>
      <Footer />
      <Lightbox />
      <Motion />
    </>
  );
}
