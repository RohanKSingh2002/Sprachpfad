// Pointer effects and sliding indicators.

import { finePointer, gsap, motionOK, onLeave } from "./motion.js";

/* ---------- spotlight: a soft light that follows the pointer over .spot elements ---------- */

export function initSpotlight() {
  if (!finePointer()) return;
  let frame = 0;
  let last = null;
  document.addEventListener(
    "pointermove",
    (e) => {
      last = e;
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const el = last.target.closest?.(".spot");
        if (!el) return;
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", `${last.clientX - r.left}px`);
        el.style.setProperty("--my", `${last.clientY - r.top}px`);
      });
    },
    { passive: true },
  );
}

/* ---------- magnetic: an element leans toward the pointer and springs back ---------- */

export function magnetic(el, strength = 0.28) {
  if (!el || !motionOK() || !finePointer()) return;
  const toX = gsap.quickTo(el, "x", { duration: 0.5, ease: "power3" });
  const toY = gsap.quickTo(el, "y", { duration: 0.5, ease: "power3" });
  const move = (e) => {
    const r = el.getBoundingClientRect();
    toX((e.clientX - (r.left + r.width / 2)) * strength);
    toY((e.clientY - (r.top + r.height / 2)) * strength);
  };
  const release = () => gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: "elastic.out(1, 0.45)" });
  el.addEventListener("pointermove", move);
  el.addEventListener("pointerleave", release);
  onLeave(() => {
    el.removeEventListener("pointermove", move);
    el.removeEventListener("pointerleave", release);
    // quickTo tweens stay paused, holding on to the element, until they are killed
    toX.tween.kill();
    toY.tween.kill();
  });
}

/* ---------- tilt: a card turns slightly toward the pointer ---------- */

const noop = () => {};

/** Returns a function that stops the effect; call it before the element is thrown away. */
export function tilt(el, { max = 7, while: isAllowed = () => true } = {}) {
  if (!el || !motionOK() || !finePointer()) return noop;
  gsap.set(el, { transformPerspective: 900 });
  const toX = gsap.quickTo(el, "rotationX", { duration: 0.6, ease: "power3" });
  const toY = gsap.quickTo(el, "rotationY", { duration: 0.6, ease: "power3" });
  const move = (e) => {
    if (!isAllowed()) return;
    const r = el.getBoundingClientRect();
    toY(((e.clientX - r.left) / r.width - 0.5) * 2 * max);
    toX(-((e.clientY - r.top) / r.height - 0.5) * 2 * max);
  };
  const release = () => {
    toX(0);
    toY(0);
  };
  el.addEventListener("pointermove", move);
  el.addEventListener("pointerleave", release);
  return () => {
    el.removeEventListener("pointermove", move);
    el.removeEventListener("pointerleave", release);
    toX.tween.kill();
    toY.tween.kill();
  };
}

/* ---------- sliding pill behind the active item of a nav or switch ---------- */

const lastSpot = new Map(); // key → { x, y, w, h } so a pill can slide on from where it was

/**
 * Put a pill behind the item marked aria-current in `container` and slide it there.
 * Containers are re-rendered on navigation, so the last position is remembered per `key`.
 */
export function slidePill(container, key, { animate = true } = {}) {
  if (!container || !gsap) return;
  let pill = container.querySelector(":scope > .pill");
  if (!pill) {
    pill = document.createElement("span");
    pill.className = "pill";
    pill.setAttribute("aria-hidden", "true");
    container.prepend(pill);
    container.classList.add("has-pill");
  }
  const active = container.querySelector('[aria-current="page"], [aria-current="true"]');
  if (!active || !active.offsetWidth) {
    gsap.to(pill, { autoAlpha: 0, duration: 0.2 });
    return;
  }
  const to = {
    x: active.offsetLeft,
    y: active.offsetTop,
    width: active.offsetWidth,
    height: active.offsetHeight,
  };
  const from = lastSpot.get(key);
  lastSpot.set(key, to);
  gsap.killTweensOf(pill);
  if (!animate || !motionOK() || !from) {
    gsap.set(pill, { ...to, autoAlpha: 1 });
    return;
  }
  gsap.fromTo(pill, { ...from, autoAlpha: 1 }, { ...to, autoAlpha: 1, duration: 0.55, ease: "expo.out" });
}
