// Smooth, weighted wheel scrolling on desktop (Lenis), kept in sync with GSAP ScrollTrigger.
// Touch devices, reduced motion and offline visits keep the browser's own scrolling.

import { finePointer, gsap, reducedMotion, ScrollTrigger } from "./motion.js";

let lenis = null;

export function initSmoothScroll() {
  if (!window.Lenis || !gsap || reducedMotion() || !finePointer()) return;
  lenis = new window.Lenis({ lerp: 0.11, wheelMultiplier: 0.95 });
  if (ScrollTrigger) lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

/** Jump to the top (used on every page change), even where the stylesheet asks for smooth scrolling. */
export function scrollToTop() {
  if (lenis) {
    lenis.scrollTo(0, { immediate: true, force: true });
    return;
  }
  const root = document.documentElement.style;
  const behavior = root.scrollBehavior;
  root.scrollBehavior = "auto";
  window.scrollTo(0, 0);
  root.scrollBehavior = behavior;
}

/** Jump straight to an element, just below the sticky top bar (used for links to a part of a page). */
export function jumpTo(el) {
  if (!el) return;
  if (lenis) {
    const bar = document.querySelector("header.nav")?.offsetHeight || 0;
    lenis.scrollTo(el, { offset: -(bar + 16), immediate: true, force: true });
    return;
  }
  const root = document.documentElement.style;
  const behavior = root.scrollBehavior;
  root.scrollBehavior = "auto";
  el.scrollIntoView({ block: "start" }); // scroll-padding-top in base.css leaves room for the top bar
  root.scrollBehavior = behavior;
}

/** Glide an element to the middle of the screen. */
export function scrollToCenter(el) {
  if (!el) return;
  if (lenis) {
    const r = el.getBoundingClientRect();
    lenis.scrollTo(el, { offset: -(window.innerHeight - r.height) / 2, duration: 1.2 });
  } else {
    el.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "center" });
  }
}
