/* A screenshot from public/screens, at 480 to 2560 wide. All of them are
   2560x1600 originals (a 1280x800 desktop at 2x), so the box is fixed at
   16:10 before the file arrives and nothing on the page moves when it does,
   and high-density screens get a sharp copy.

   It links to the full-size file, so it opens even without a script; with
   one, components/lightbox.tsx opens it over the page instead. */
export function Screenshot({
  name,
  alt,
  sizes,
  priority = false,
  className = "",
}: {
  name: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <a
      href={`/screens/${name}-2560.webp`}
      data-zoom
      className="group relative block cursor-zoom-in focus-visible:outline-offset-[-4px]"
    >
      {/* The link's name is this plus the picture's alt. */}
      <span className="sr-only">Enlarge: </span>
      {/* eslint-disable-next-line @next/next/no-img-element -- pre-sized variants, no image server */}
      <img
        src={`/screens/${name}-1280.webp`}
        srcSet={[480, 640, 960, 1280, 1920, 2560].map((w) => `/screens/${name}-${w}.webp ${w}w`).join(", ")}
        sizes={sizes}
        width={1280}
        height={800}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding="async"
        className={`block h-auto w-full ${className}`}
      />
      {/* Shown on hover and focus, and always on touch screens, which
          have no hover to find it with. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full border border-white/15 bg-ink-0/75 px-2.5 py-1 text-xs font-medium text-text opacity-0 backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100 pointer-coarse:opacity-90"
      >
        <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
          <circle cx="7" cy="7" r="4.5" />
          <path d="M10.5 10.5 14 14M7 5v4M5 7h4" />
        </svg>
        Enlarge
      </span>
    </a>
  );
}
