"use client";

import { inView, scroll, stagger } from "motion";
import { animate } from "motion/mini";
import { useEffect } from "react";

/* Everything on the page that moves, in one place, with vanilla Motion:
   the small WAAPI animate from motion/mini, plus inView, scroll and
   stagger. The page itself stays server-rendered; it marks what moves with
   data attributes, and this finds them.

   The server renders every part where it ends up. Under html.motion (see
   the head script in app/layout.tsx) globals.css puts the parts below the
   fold at their starting points, and this moves them on. Without that
   class (reduced motion, or no script) only the reading-progress line
   runs, and nothing waits to be shown. */

const ease = [0.22, 1, 0.36, 1] as const;

const wait = (ms: number) => new Promise((done) => setTimeout(done, ms));

/* Once, when the element comes into view. */
function once(el: Element, run: () => void, options: Parameters<typeof inView>[2]) {
  const stop = inView(
    el,
    () => {
      stop();
      run();
    },
    options,
  );
  return stop;
}

const targetsOf = (el: Element) => (el.hasAttribute("data-reveal-children") ? [...el.children] : [el]);

/* Rises into place, children one after another. */
function reveal(el: Element) {
  const targets = targetsOf(el);
  animate(
    targets,
    { opacity: [0, 1], transform: ["translateY(24px)", "none"] },
    { duration: 0.7, ease, delay: stagger(0.08) },
  );
}

/* The idle-memory numbers, counting up with their bars. */
function countUp(el: HTMLElement, delay: number, alive: () => boolean) {
  const to = Number(el.dataset.count);
  const show = (n: number) =>
    (el.textContent = `${el.dataset.prefix ?? ""}${Math.round(n).toLocaleString("en-US")}${el.dataset.suffix ?? ""}`);
  const start = performance.now() + delay * 1000;
  show(0);
  const tick = (now: number) => {
    const p = Math.min(1, Math.max(0, (now - start) / 1000));
    if (!alive()) return show(to);
    show(to * (1 - (1 - p) ** 3));
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

/* The hero's last words, typed, deleted and typed again, like someone
   trying a few, once round and back to the first. Only while the hero is
   on screen. */
function typeWords(el: HTMLElement, caret: HTMLElement, words: string[]) {
  let done = false;
  let w = 0;
  let n = words[0].length;
  let phase: "hold" | "delete" | "type" = "hold";
  let timer = 0;
  const later = (ms: number) => void (timer = window.setTimeout(step, ms));
  function step() {
    if (phase === "hold") {
      phase = "delete";
      caret.dataset.busy = "";
    }
    if (phase === "delete") {
      n -= 1;
      el.textContent = words[w].slice(0, n);
      if (n > 0) return later(35);
      w = (w + 1) % words.length;
      done = w === 0;
      phase = "type";
      return later(320);
    }
    n += 1;
    el.textContent = words[w].slice(0, n);
    if (n < words[w].length) return later(55 + Math.random() * 60);
    phase = "hold";
    delete caret.dataset.busy;
    if (!done) later(2600);
  }
  return {
    start: () => {
      clearTimeout(timer);
      if (!done) later(phase === "hold" ? 2600 : 60);
    },
    stop: () => clearTimeout(timer),
  };
}

/* The Ghostty window: a prompt with a blinking caret, then each command
   typed out and its note printed under it, ending on an empty prompt.
   Each command's untyped rest stays in the line, invisible, so the window
   is its full size from the start and nothing below it moves. */
function typeTerminal(term: HTMLElement, alive: () => boolean) {
  const caret = term.querySelector<HTMLElement>("[data-caret]");
  if (!caret) return () => {};
  const lines = [...term.querySelectorAll<HTMLElement>("[data-line]")].map((line) => {
    const cmd = line.querySelector<HTMLElement>("[data-cmd]")!;
    const full = cmd.textContent ?? "";
    const typed = document.createTextNode("");
    const rest = document.createElement("span");
    rest.className = "invisible";
    rest.textContent = full;
    cmd.replaceChildren(typed, rest);
    return { line, full, typed, rest, note: line.querySelector<HTMLElement>("[data-note]") };
  });
  const at = (l: (typeof lines)[number]) => {
    l.line.style.visibility = "visible";
    l.rest.before(caret);
  };
  at(lines[0]);

  return once(
    term,
    async () => {
      for (const [i, l] of lines.entries()) {
        at(l);
        if (!l.full) break;
        await wait(i === 0 ? 600 : 300);
        caret.dataset.busy = "";
        for (let n = 1; n <= l.full.length; n++) {
          if (!alive()) return;
          l.typed.data = l.full.slice(0, n);
          l.rest.textContent = l.full.slice(n);
          await wait(26 + Math.random() * 50);
        }
        delete caret.dataset.busy;
        await wait(380);
        if (l.note) {
          l.note.style.visibility = "visible";
          animate(l.note, { opacity: [0, 1], transform: ["translateX(-6px)", "none"] }, { duration: 0.3, ease });
          await wait(240);
        }
      }
    },
    { amount: 0.5 },
  );
}

export function Motion() {
  useEffect(() => {
    const root = document.documentElement;
    let alive = true;
    const stops: VoidFunction[] = [];
    try {
      setUp(root.classList.contains("motion"), () => alive, stops);
      root.classList.add("motion-on");
    } catch (error) {
      /* Show the page as it is rather than leave parts of it hidden. */
      root.classList.remove("motion");
      console.error(error);
    }
    return () => {
      alive = false;
      stops.forEach((stop) => stop());
    };
  }, []);

  return null;
}

function setUp(moving: boolean, alive: () => boolean, stops: VoidFunction[]) {
  const all = <T extends Element = HTMLElement>(selector: string) => [...document.querySelectorAll<T & Element>(selector)];

  /* How far down the page you are, as a line under the header. Tied to
     scrolling, so it stays with reduced motion too. */
  for (const bar of all("[data-progress]")) {
    stops.push(scroll(animate(bar, { transform: ["scaleX(0)", "scaleX(1)"] }, { ease: "linear" })));
  }

  if (moving) {
    for (const el of all("[data-reveal], [data-reveal-children]")) {
      /* Already scrolled past (a reload partway down, or a link to
         #download): just there. */
      if (el.getBoundingClientRect().bottom < 0) {
        for (const t of targetsOf(el) as HTMLElement[]) {
          t.style.opacity = "1";
          t.style.transform = "none";
        }
        continue;
      }
      stops.push(once(el, () => reveal(el), { margin: "0px 0px -12% 0px" }));
    }

    /* The desktop screenshot lies back a little and straightens up as you
       scroll to it. */
    for (const el of all("[data-tilt]")) {
      stops.push(
        scroll(
          animate(
            el,
            { transform: ["perspective(1400px) rotateX(9deg) scale(0.96)", "perspective(1400px) rotateX(0deg) scale(1)"] },
            { ease: "linear" },
          ),
          { target: el.closest("section") ?? el, offset: ["start start", "400px start"] },
        ),
      );
    }

    /* The wallpaper's light, drifting slowly. */
    for (const el of all("[data-glow]")) {
      const glow = animate(
        el,
        { transform: ["scale(1) rotate(0deg)", "scale(1.12) rotate(10deg)"], opacity: [0.3, 0.45] },
        { duration: 9, repeat: 1, repeatType: "reverse", ease: "easeInOut" },
      );
      stops.push(() => glow.stop());
    }

    /* The update timeline's line, drawn as you read down it. */
    for (const el of all("[data-draw]")) {
      stops.push(
        scroll(animate(el, { transform: ["scaleY(0)", "scaleY(1)"] }, { ease: "linear" }), {
          target: el.parentElement ?? el,
          offset: ["start 75%", "end 55%"],
        }),
      );
    }

    for (const box of all("[data-bars]")) {
      stops.push(
        once(
          box,
          () => {
            animate(
              [...box.querySelectorAll("[data-bar]")],
              { clipPath: ["inset(0 100% 0 0 round 999px)", "inset(0 0% 0 0 round 999px)"] },
              { duration: 1, ease, delay: stagger(0.15) },
            );
            box.querySelectorAll<HTMLElement>("[data-count]").forEach((el, i) => countUp(el, i * 0.15, alive));
          },
          { margin: "0px 0px -15% 0px" },
        ),
      );
    }

    /* "Left out": each one crossed off in turn. */
    for (const list of all("[data-strikes]")) {
      stops.push(
        once(
          list,
          () =>
            void animate(
              [...list.querySelectorAll("[data-strike]")],
              { transform: ["scaleX(0)", "scaleX(1)"] },
              { duration: 0.45, ease: "easeOut", delay: stagger(0.15, { startDelay: 0.4 }) },
            ),
          { amount: 0.6 },
        ),
      );
    }

    for (const term of all("[data-terminal]")) stops.push(typeTerminal(term, alive));

    for (const el of all("[data-words]")) {
      const caret = el.parentElement?.querySelector<HTMLElement>(".caret");
      if (!caret) continue;
      const typer = typeWords(el, caret, JSON.parse(el.dataset.words ?? "[]") as string[]);
      stops.push(
        inView(el, () => {
          typer.start();
          return typer.stop;
        }),
        typer.stop,
      );
    }
  }
}
