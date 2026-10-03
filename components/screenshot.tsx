/* A screenshot from public/screens, at 480, 640, 960 and 1280 wide. All of them
   are 1280x800 originals, so the box is fixed at 16:10 before the file
   arrives and nothing on the page moves when it does. */
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
    // eslint-disable-next-line @next/next/no-img-element -- pre-sized variants, no image server
    <img
      src={`/screens/${name}-1280.webp`}
      srcSet={[480, 640, 960, 1280].map((w) => `/screens/${name}-${w}.webp ${w}w`).join(", ")}
      sizes={sizes}
      width={1280}
      height={800}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      className={`block h-auto w-full ${className}`}
    />
  );
}
