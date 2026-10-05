import Link from "next/link";

/* The docs' bar: back to AtlasOS on the left, the docs and the source on
   the right. Plain links: nothing here needs script. */
export function DocsHeader({ version, released }: { version?: string; released?: boolean }) {
  return (
    <header className="sticky top-0 z-20 border-b border-line/70 bg-ink-0/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[90rem] items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
            {/* eslint-disable-next-line @next/next/no-img-element -- a 3 KB SVG */}
            <img src="/brand/atlas-mark.svg" alt="" width={28} height={28} className="size-7" />
            <span className="whitespace-nowrap max-[420px]:sr-only">AtlasOS</span>
          </Link>
          <span aria-hidden="true" className="text-line-strong">/</span>
          <Link href="/docs" className="truncate font-medium text-text-2 hover:text-text">
            Framework docs
          </Link>
          {version && (
            <span className="hidden whitespace-nowrap rounded-full border border-line px-2 py-0.5 text-xs text-text-3 sm:inline">
              {version}
              {released === false && " · unreleased"}
            </span>
          )}
        </div>
        <nav aria-label="Main" className="flex items-center gap-1 text-sm">
          <a href="https://github.com/EternalCoder454/atlas-framework" className="rounded-md px-3 py-2 text-text-2 hover:text-text">
            GitHub
          </a>
          <Link href="/#download" className="hidden rounded-lg bg-violet-deep px-4 py-2 font-semibold text-white hover:bg-violet sm:block">
            Download AtlasOS
          </Link>
        </nav>
      </div>
    </header>
  );
}
