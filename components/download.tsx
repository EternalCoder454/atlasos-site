import { CopyButton } from "@/components/copy-button";
import { images, imageIds, type ImageId } from "@/lib/images";
import type { Release } from "@/lib/releases";
import { links } from "@/lib/site";

/* Counted in 1024s, as browsers' download lists and Windows Explorer do, so the
   size here is the one people see once the ISO is on their disk. */
function gigabytes(bytes: number) {
  return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
}

/* 44.20261003 is the build of 3 October 2026. */
function versionDate(version: string) {
  const d = version.slice(3);
  const date = new Date(`${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}T12:00:00Z`);
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

function Option({ id, release }: { id: ImageId; release: Release | null }) {
  const image = images[id];
  return (
    <div className="flex flex-col gap-5 py-7 first:pt-0 last:pb-0 md:flex-row md:items-start md:justify-between md:gap-10">
      <div className="min-w-0 md:max-w-md">
        <h3 className="text-xl font-semibold">{image.name}</h3>
        <p className="mt-1.5 text-text-2">For {image.forWhat}</p>
        {id === "atlasos-nvidia" && (
          <p className="mt-2 text-sm text-text-3">
            With Secure Boot on, the installer gives you a one-time password, and you confirm the
            Telamon OS key with it on the first restart. Once.{" "}
            <a href={links.nvidia} className="text-violet-hi underline decoration-violet-hi/40 underline-offset-4 hover:decoration-violet-hi">
              More about this
            </a>
          </p>
        )}
      </div>

      <div className="w-full md:w-80 md:shrink-0">
        {release ? (
          <>
            <a
              href={`/download/${id}`}
              rel="nofollow"
              className="group flex items-center justify-center gap-2 rounded-xl bg-violet-deep px-5 py-3 font-semibold text-white transition-colors hover:bg-violet"
            >
              <svg aria-hidden="true" viewBox="0 0 20 20" className="size-4 fill-current transition-[translate] duration-300 group-hover:translate-y-0.5">
                <path d="M10 2a1 1 0 0 1 1 1v8.6l2.8-2.8a1 1 0 1 1 1.4 1.4l-4.5 4.5a1 1 0 0 1-1.4 0L4.8 10.2a1 1 0 0 1 1.4-1.4L9 11.6V3a1 1 0 0 1 1-1Zm-7 14a1 1 0 0 1 1-1h12a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1Z" />
              </svg>
              Download ISO
              <span className="font-normal text-white">{gigabytes(release.size)}</span>
            </a>
            <p className="mt-2.5 text-sm text-text-3">
              Version {release.version}, {versionDate(release.version)}
            </p>
            <div className="mt-3 rounded-lg border border-line bg-ink-1 p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-medium uppercase tracking-wider text-text-3">SHA-256</span>
                <CopyButton text={release.sha256} label={`Copy the SHA-256 of ${release.file}`} />
              </div>
              <p className="mt-1.5 break-all font-mono text-xs leading-relaxed text-text-2">{release.sha256}</p>
              <a
                href={`/dl/${release.file}.sha256`}
                className="mt-2 inline-block text-xs text-violet-hi underline decoration-violet-hi/40 underline-offset-4 hover:decoration-violet-hi"
              >
                {release.file}.sha256
              </a>
            </div>
          </>
        ) : (
          <div className="rounded-xl border border-dashed border-line-strong px-5 py-4 text-sm text-text-2">
            The first ISO is on its way. It&apos;s built with each weekly stable release; until then, see{" "}
            <a href="#switch" className="text-violet-hi underline decoration-violet-hi/40 underline-offset-4 hover:decoration-violet-hi">
              switching from Fedora
            </a>
            .
          </div>
        )}
      </div>
    </div>
  );
}

const requirements = [
  ["Processor", "64-bit Intel or AMD, 2 cores", "4 cores or more"],
  ["Memory", "4 GB", "8 GB or more"],
  ["Storage", "40 GB", "64 GB or more, on an SSD"],
  ["Graphics", "Anything with an open-source driver: Intel, AMD, or NVIDIA with nouveau", "Intel or AMD; NVIDIA GeForce GTX 16 / RTX 20 series or newer, with the NVIDIA ISO"],
  ["Firmware", "UEFI", "UEFI"],
  ["Internet", "To install and for updates", "The same"],
];

export function Download({ releases }: { releases: Record<ImageId, Release | null> }) {
  const example = releases.atlasos?.file ?? "atlasos-44.YYYYMMDD.iso";
  return (
    <section id="download" aria-labelledby="download-title" className="border-t border-line bg-ink-1 py-20 sm:py-28">
      <div className="wrap">
        <div data-reveal-children className="max-w-2xl">
          <h2 id="download-title" className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Get Telamon OS
          </h2>
          <p className="mt-4 text-lg text-text-2">
            One ISO per graphics setup. It boots a live session with the installer already open,
            and installs the same signed image that updates itself afterwards.
          </p>
        </div>

        <div data-reveal className="mt-10 divide-y divide-line rounded-[var(--radius-card)] border border-line bg-ink-0 p-6 sm:p-8">
          {imageIds.map((id) => (
            <Option key={id} id={id} release={releases[id]} />
          ))}
        </div>

        <p data-reveal className="mt-4 text-sm text-text-3">
          Downloads are shared out fairly: a few links per visitor an hour, two downloads at a time
          each, and a speed cap per download so the server stays quick for everyone. If every slot
          is busy, try again in a few minutes.
        </p>

        <div data-reveal-children className="mt-14 max-w-3xl">
          <div>
            <h3 className="text-xl font-semibold">Install it</h3>
            <ol className="mt-5 space-y-5">
              {[
                <>Download the ISO for your graphics card.</>,
                <>
                  Check it. In the folder you saved it to, with the <code className="text-sm">.sha256</code> file beside it:
                  <span className="mt-2 flex items-center gap-3 rounded-lg border border-line bg-ink-0 px-3 py-2">
                    <code className="min-w-0 flex-1 text-sm text-text [overflow-wrap:anywhere]">
                      sha256sum -c {example}.sha256
                    </code>
                  </span>
                </>,
                <>
                  Write it to a USB stick of 8 GB or more, with{" "}
                  <a href={links.mediaWriter} className="text-violet-hi underline decoration-violet-hi/40 underline-offset-4 hover:decoration-violet-hi">
                    Fedora Media Writer
                  </a>{" "}
                  or any tool that writes ISOs as they are.
                </>,
                <>Boot from the stick and follow the installer. Your first login opens the setup: language, keyboard, Light or Dark, your launcher and your account.</>,
              ].map((step, i) => (
                <li key={i} className="flex gap-4">
                  <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border border-line-strong font-mono text-sm text-violet-hi">
                    {i + 1}
                  </span>
                  <div className="min-w-0 text-text-2">{step}</div>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* A real table, with its column headings. On a phone each row
            stacks, labelled, rather than squeezing three columns in. The
            explicit roles keep it a table to screen readers when its
            display changes (Safari drops the semantics otherwise). */}
        <div data-reveal className="mt-14">
          <h3 className="text-xl font-semibold">System requirements</h3>
          <div className="mt-5 overflow-hidden rounded-[var(--radius-card)] border border-line">
            <table role="table" className="w-full text-left max-sm:block">
              <thead role="rowgroup" className="bg-ink-2/60 text-sm max-sm:hidden">
                <tr role="row">
                  <th role="columnheader" scope="col" className="w-36 px-5 py-3 font-medium text-text-3"><span className="sr-only">Part</span></th>
                  <th role="columnheader" scope="col" className="px-5 py-3 font-semibold text-text">Minimum</th>
                  <th role="columnheader" scope="col" className="px-5 py-3 font-semibold text-text">Recommended</th>
                </tr>
              </thead>
              <tbody role="rowgroup" className="divide-y divide-line max-sm:block">
                {requirements.map(([what, min, rec]) => (
                  <tr role="row" key={what} className="max-sm:block max-sm:px-4 max-sm:py-4">
                    <th role="rowheader" scope="row" className="px-5 py-4 align-top font-medium text-text-3 max-sm:block max-sm:p-0 max-sm:text-text">
                      {what}
                    </th>
                    <td role="cell" className="px-5 py-4 align-top text-text max-sm:mt-1.5 max-sm:block max-sm:p-0 max-sm:text-text-2">
                      <span className="text-text-3 sm:hidden">Minimum: </span>
                      {min}
                    </td>
                    <td role="cell" className="px-5 py-4 align-top text-text-2 max-sm:mt-1 max-sm:block max-sm:p-0">
                      <span className="text-text-3 sm:hidden">Recommended: </span>
                      {rec}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-sm text-text-3">Telamon OS is tuned for and tested on 8 GB of memory.</p>
        </div>

        <div id="switch" data-reveal className="mt-16 rounded-[var(--radius-card)] border border-line bg-ink-0 p-6 sm:p-8">
          <h3 className="text-xl font-semibold">Already on Fedora Atomic?</h3>
          <p className="mt-2 max-w-2xl text-text-2">
            Switch a Fedora Kinoite 44 install (or another Fedora Atomic desktop) over in place and
            restart. Your files in <code className="text-sm">/home</code> stay as they are. With NVIDIA&apos;s
            driver, use <code className="text-sm">atlasos-nvidia</code> instead.
          </p>
          <div className="mt-5 flex items-center gap-3 rounded-lg border border-line bg-ink-1 px-4 py-3">
            <code className="min-w-0 flex-1 text-sm text-text [overflow-wrap:anywhere]">
              <span className="select-none text-text-3">$ </span>sudo bootc switch {images.atlasos.ref}
            </code>
            <CopyButton text={`sudo bootc switch ${images.atlasos.ref}`} label="Copy the bootc switch command" />
          </div>
        </div>
      </div>
    </section>
  );
}
