// Animation toolkit. GSAP and its plugins come from the CDN scripts in index.html. If they don't load
// (offline) or the visitor prefers reduced motion, nothing is hidden and everything simply appears.
//
// Motion language: things enter with an expo ease-out (fast start, long soft landing), rise 12–24px,
// and follow each other in short staggers. Only transform and opacity are animated.

export const gsap = window.gsap;
export const { Flip, Draggable, ScrollTrigger, SplitText } = window;

if (gsap) {
  const plugins = [Flip, Draggable, ScrollTrigger, SplitText].filter(Boolean);
  if (plugins.length) gsap.registerPlugin(...plugins);
}

const reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const fineQuery = window.matchMedia("(hover: hover) and (pointer: fine)");

export const reducedMotion = () => reduceQuery.matches;
/** True when animations should run: GSAP loaded and the visitor hasn't asked for reduced motion. */
export const motionOK = () => !!gsap && !reduceQuery.matches;
/** A mouse or trackpad (hover effects make sense). */
export const finePointer = () => fineQuery.matches;

const RESET = "opacity,visibility,transform";

/* ---------- clean-up between pages ---------- */

let cleanups = [];

/** Register something to undo (a tween, a listener, a split) when the page changes. */
export const onLeave = (fn) => cleanups.push(fn);

export function runCleanups() {
  cleanups.forEach((fn) => {
    try {
      fn();
    } catch (e) {
      // ignore: the element may already be gone
    }
  });
  cleanups = [];
  ScrollTrigger?.getAll().forEach((t) => t.kill());
}

/* ---------- building blocks ---------- */

/** Short horizontal shake for a wrong answer. */
export function shake(el) {
  if (motionOK() && el) gsap.to(el, { keyframes: { x: [0, -7, 7, -4, 4, 0] }, duration: 0.36, ease: "none" });
}

/** Fade and rise elements into place, one after another. Returns the tween (or null). */
export function enter(targets, { y = 18, x = 0, duration = 0.8, stagger = 0.06, delay = 0, scale = 1 } = {}) {
  if (!motionOK()) return null;
  const list = gsap.utils.toArray(targets);
  if (!list.length) return null;
  const tween = gsap.from(list, {
    autoAlpha: 0,
    y,
    x,
    scale,
    duration,
    stagger,
    delay,
    ease: "expo.out",
    clearProps: RESET,
  });
  onLeave(() => tween.kill());
  return tween;
}

/**
 * Reveal elements as they scroll into view, once, in small batches. Anything still hidden when the
 * bottom of the page is reached is shown too, so short pages never keep content invisible.
 *
 * Waiting elements are only transparent (opacity, not visibility), so keyboard and screen reader
 * users can still reach them; whatever receives focus is shown at once.
 */
export function revealOnScroll(targets, { y = 22, duration = 0.8, stagger = 0.07, start = "top 92%" } = {}) {
  if (!motionOK() || !ScrollTrigger) return;
  const list = gsap.utils.toArray(targets);
  if (!list.length) return;
  const waiting = new Set(list);
  gsap.set(list, { opacity: 0, y });
  const show = (batch) => {
    const due = batch.filter((el) => waiting.delete(el));
    if (!due.length) return;
    gsap.to(due, {
      opacity: 1,
      y: 0,
      duration,
      stagger,
      ease: "expo.out",
      overwrite: true,
      clearProps: RESET,
    });
  };
  // Elements that come into view in the same frame are revealed together, one after another.
  // (ScrollTrigger.batch does the same but leaves a paused timer behind for every call.)
  let queue = [];
  let frame = 0;
  const flush = () => {
    frame = 0;
    show(queue);
    queue = [];
  };
  list.forEach((el) =>
    ScrollTrigger.create({
      trigger: el,
      start,
      once: true,
      onEnter: () => {
        queue.push(el);
        if (!frame) frame = requestAnimationFrame(flush);
      },
    }),
  );
  ScrollTrigger.create({
    trigger: document.body,
    start: "bottom bottom+=2",
    once: true,
    onEnter: () => show([...waiting]),
  });
  const onFocus = (e) => {
    const el = list.find((x) => x.contains(e.target));
    if (el) show([el]);
  };
  document.addEventListener("focusin", onFocus);
  onLeave(() => {
    cancelAnimationFrame(frame);
    document.removeEventListener("focusin", onFocus);
  });
}

/**
 * Split a heading into lines (or words) and slide them up from behind a mask.
 * `onScroll` waits until the heading scrolls into view.
 */
export function splitReveal(
  el,
  { by = "lines", onScroll = false, delay = 0, duration = 1, stagger = 0.08 } = {},
) {
  if (!motionOK() || !SplitText || !el) return;
  const split = SplitText.create(el, {
    type: by === "words" ? "lines,words" : "lines",
    mask: "lines",
    linesClass: "split-line",
    autoSplit: true,
    onSplit(self) {
      return gsap.from(by === "words" ? self.words : self.lines, {
        yPercent: 135, // far enough that no umlaut peeks over the mask's lower edge at the start
        rotate: by === "words" ? 3 : 0,
        duration,
        stagger,
        delay,
        ease: "expo.out",
        scrollTrigger: onScroll ? { trigger: el, start: "top 90%", once: true } : undefined,
      });
    },
  });
  onLeave(() => split.revert());
}

/**
 * Count a number up from zero, when it scrolls into view. `format` turns the number into text.
 * Screen readers get the final number straight away; only the visible digits count.
 */
export function countUp(el, to, { duration = 1.4, delay = 0, format = String } = {}) {
  if (!el) return;
  el.textContent = format(to);
  if (!motionOK() || !to) return;
  el.innerHTML = '<span aria-hidden="true"></span><span class="sr"></span>';
  const [digits, real] = el.children;
  real.textContent = format(to);
  digits.textContent = format(0);
  const counter = { v: 0 };
  const tween = gsap.to(counter, {
    v: to,
    duration,
    delay,
    ease: "power3.out",
    onUpdate: () => {
      digits.textContent = format(Math.round(counter.v));
    },
    scrollTrigger: ScrollTrigger ? { trigger: el, start: "top 92%", once: true } : undefined,
  });
  onLeave(() => tween.kill());
}

/**
 * Play a CSS "draw" transition: the element gets .pre-draw (its line or bar collapsed), then loses it
 * when it scrolls into view (or straight away), and CSS eases it into place.
 */
export function drawIn(el, { onScroll = false } = {}) {
  if (!motionOK() || !el) return;
  el.classList.add("pre-draw");
  el.getBoundingClientRect(); // commit the collapsed state before it animates
  const go = () => el.classList.remove("pre-draw");
  if (onScroll && ScrollTrigger)
    ScrollTrigger.create({ trigger: el, start: "top 92%", once: true, onEnter: go });
  else requestAnimationFrame(() => requestAnimationFrame(go));
}
