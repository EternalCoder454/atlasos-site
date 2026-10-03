"use client";

/* The screenshots, opened over the page. Any link marked data-zoom
   (components/screenshot.tsx) opens here instead of on its own, and the
   arrows step through them in page order.

   Clicking the picture magnifies it where you clicked; then the view
   follows the mouse, or the picture follows a dragging finger, and the
   arrow keys look around. Clicking again, or Esc, goes back.
   The originals are 1280x800, so it magnifies enough to show them at full
   size even on a phone, and no further than 4x.

   A native modal <dialog>: the browser keeps focus inside, makes the page
   behind it inert, closes it on Esc and returns focus to the link. */
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent as ClickEvent,
  type PointerEvent,
  type Ref,
} from "react";

type Shot = { src: string; alt: string };

export function Lightbox() {
  const dialog = useRef<HTMLDialogElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const frame = useRef<HTMLButtonElement>(null);
  const [shots, setShots] = useState<Shot[]>([]);
  const [index, setIndex] = useState(0);
  /* The magnification (1 when not zoomed) and where it's centred, in % of
     the picture. */
  const [scale, setScale] = useState(1);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });
  /* A press on the picture: where it started and the view then, so a drag
     moves the view from there and isn't also taken as a click. */
  const press = useRef<{ x: number; y: number; origin: { x: number; y: number } } | null>(null);
  const dragged = useRef(false);
  /* What a press outside the picture started on: only a click that starts
     and ends on the backdrop closes, not a drag or a text selection that
     ends there. */
  const downOn = useRef<EventTarget | null>(null);

  const reset = () => {
    setScale(1);
    press.current = null;
    dragged.current = false;
  };

  useEffect(() => {
    const open = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = (e.target as Element | null)?.closest?.<HTMLAnchorElement>("a[data-zoom]");
      if (!link || !dialog.current) return;
      e.preventDefault();
      const links = [...document.querySelectorAll<HTMLAnchorElement>("a[data-zoom]")];
      setShots(links.map((a) => ({ src: a.href, alt: a.querySelector("img")?.alt ?? "" })));
      setIndex(links.indexOf(link));
      reset();
      dialog.current.showModal();
      close.current?.focus();
    };
    document.addEventListener("click", open);
    return () => document.removeEventListener("click", open);
  }, []);

  const shot = shots[index];
  const zoomed = scale > 1;

  /* The pictures either side, fetched ahead so stepping to one doesn't
     show an empty frame while it loads. */
  useEffect(() => {
    if (shots.length < 2) return;
    for (const step of [-1, 1]) new Image().src = shots[(index + step + shots.length) % shots.length].src;
  }, [shots, index]);

  const go = (step: number) => {
    setIndex((i) => (i + step + shots.length) % shots.length);
    reset();
  };

  const clamp = (n: number) => Math.min(100, Math.max(0, n));
  const at = (e: { clientX: number; clientY: number }) => {
    const r = frame.current!.getBoundingClientRect();
    return { x: clamp(((e.clientX - r.left) / r.width) * 100), y: clamp(((e.clientY - r.top) / r.height) * 100) };
  };

  const toggle = (e: ClickEvent) => {
    /* A keyboard press (detail 0) has no point, so it zooms the middle. */
    const key = e.detail === 0;
    if (dragged.current && !key) {
      dragged.current = false;
      return;
    }
    if (zoomed) return reset();
    setOrigin(key ? { x: 50, y: 50 } : at(e));
    const width = frame.current!.getBoundingClientRect().width;
    setScale(Math.min(4, Math.max(2, 1280 / width)));
  };

  const down = (e: PointerEvent<HTMLElement>) => {
    /* Captured, so the release comes here even off the picture. */
    e.currentTarget.setPointerCapture(e.pointerId);
    press.current = { x: e.clientX, y: e.clientY, origin };
    dragged.current = false;
  };
  const move = (e: PointerEvent) => {
    if (!zoomed) return;
    /* A mouse looks around just by moving: the view follows the pointer. */
    if (e.pointerType === "mouse") {
      if (press.current && Math.hypot(e.clientX - press.current.x, e.clientY - press.current.y) > 6) {
        dragged.current = true;
      }
      return setOrigin(at(e));
    }
    /* A finger drags the picture, which moves with it. Moving the origin
       by d moves the picture by d * (1 - scale), so it's scaled back. */
    const p = press.current;
    if (!p) return;
    const r = frame.current!.getBoundingClientRect();
    const dx = (e.clientX - p.x) / r.width;
    const dy = (e.clientY - p.y) / r.height;
    if (Math.hypot(e.clientX - p.x, e.clientY - p.y) > 6) dragged.current = true;
    setOrigin({ x: clamp(p.origin.x - (dx * 100) / (scale - 1)), y: clamp(p.origin.y - (dy * 100) / (scale - 1)) });
  };
  const up = () => {
    press.current = null;
  };

  const keys = (e: KeyboardEvent) => {
    /* Alt+Left is the browser's Back, and the rest aren't ours either. */
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    const step = { ArrowLeft: -1, ArrowRight: 1 }[e.key];
    if (!step) {
      if (zoomed && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
        e.preventDefault();
        setOrigin((o) => ({ ...o, y: clamp(o.y + (e.key === "ArrowUp" ? -10 : 10)) }));
      }
      return;
    }
    e.preventDefault();
    /* Zoomed, the arrows look around; otherwise they change picture. */
    if (zoomed) setOrigin((o) => ({ ...o, x: clamp(o.x + step * 10) }));
    else go(step);
  };

  return (
    <dialog
      ref={dialog}
      aria-label="Screenshot"
      className="lightbox m-0 h-dvh max-h-none w-screen max-w-none overflow-hidden overscroll-contain bg-transparent p-0 text-text backdrop:bg-ink-0/90 backdrop:backdrop-blur-md"
      onCancel={(e) => {
        /* Esc steps back out of the zoom first. */
        if (zoomed) {
          e.preventDefault();
          reset();
        }
      }}
      onClose={reset}
      onKeyDown={keys}
      onPointerDown={(e) => {
        downOn.current = e.target;
      }}
      onClick={(e) => {
        const t = e.target as HTMLElement;
        if (t.dataset.backdrop !== undefined && downOn.current === t) dialog.current?.close();
      }}
    >
      <div data-backdrop className="flex h-full flex-col px-4 pb-4 pt-3 sm:px-8 sm:pb-6">
        <div className="flex items-center gap-2 text-sm text-text-2">
          <span className="mr-auto tabular-nums" aria-live="polite">
            {shots.length > 1 && `${index + 1} of ${shots.length}`}
          </span>
          {shots.length > 1 && (
            <>
              <Control label="Previous screenshot" onClick={() => go(-1)} d="M10 3.5 5.5 8l4.5 4.5" />
              <Control label="Next screenshot" onClick={() => go(1)} d="M6 3.5 10.5 8 6 12.5" />
            </>
          )}
          <Control ref={close} label="Close" onClick={() => dialog.current?.close()} d="M4 4l8 8M12 4l-8 8" />
        </div>

        {shot && (
          <figure data-backdrop className="lightbox-body flex min-h-0 flex-1 flex-col items-center justify-center gap-3 pt-3">
            <button
              ref={frame}
              type="button"
              aria-label="Zoom"
              aria-pressed={zoomed}
              onClick={toggle}
              onPointerDown={down}
              onPointerMove={move}
              onPointerUp={up}
              onPointerCancel={up}
              className={`relative max-w-full overflow-hidden rounded-[var(--radius-card)] border border-line-strong/60 bg-ink-1 shadow-[0_30px_80px_-30px_rgba(10,6,40,0.9)] ${zoomed ? "cursor-zoom-out touch-none" : "cursor-zoom-in"} focus-visible:rounded-[var(--radius-card)]`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- the full-size file, already pre-sized */}
              <img
                key={shot.src}
                src={shot.src}
                width={1280}
                height={800}
                alt=""
                draggable={false}
                className="block h-auto max-h-[calc(100dvh-9.5rem)] w-auto max-w-full select-none transition-transform duration-300 ease-out motion-reduce:transition-none"
                style={{ transform: `scale(${scale})`, transformOrigin: `${origin.x}% ${origin.y}%` }}
              />
            </button>
            <figcaption className="max-w-3xl text-balance text-center text-sm text-text-2">{shot.alt}</figcaption>
          </figure>
        )}
      </div>
    </dialog>
  );
}

function Control({
  label,
  d,
  onClick,
  ref,
}: {
  label: string;
  d: string;
  onClick: () => void;
  ref?: Ref<HTMLButtonElement>;
}) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid size-10 place-items-center rounded-full focus-visible:rounded-full border border-line-strong/60 bg-ink-1/80 text-text transition-colors hover:border-violet hover:bg-ink-3"
    >
      <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d={d} />
      </svg>
    </button>
  );
}
