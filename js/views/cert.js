// Practice certificate for a level, shown once its mock test is passed.

import { doneCount, passed, testResult } from "../state.js";
import { tilt } from "../ui/effects.js";
import { enter, gsap, motionOK, onLeave, splitReveal } from "../ui/motion.js";
import { germanDate } from "../utils.js";
import { breadcrumb } from "./shared.js";

export function render(level) {
  const { test } = level;
  const crumb = breadcrumb(level, "Certificate");
  if (!passed(level)) {
    return `${crumb}<h1 class="cert-locked">${level.name} practice certificate</h1>
      <p class="muted">Your certificate appears here after you score at least ${test.passMark} of ${test.total} in ${test.objectiveLabel || "listening and reading"} on the ${level.name} practice assessment.</p>
      <a class="btn" href="#/${level.id}/test">Take the ${level.name} mock test</a><div style="height:60px"></div>`;
  }
  const result = testResult(level);
  const date = germanDate(new Date(result.date));
  return `${crumb}
  <div class="cert-stage" id="certStage">
    <article class="cert" id="cert" aria-label="Practice certificate ${level.name}">
      <div class="cert-brand"><i aria-hidden="true"></i>Sprachpfad</div>
      <h1 lang="de">Übungszertifikat ${level.name}</h1>
      <p class="cert-sub">${test.form ? `Objective practice record for ${level.name}; writing and speaking need separate review` : `Practice certificate for German at level ${level.name}`}</p>
      <dl class="cert-grid" lang="de">
        <div><dt>${test.form ? "Objektive Übungen" : "Hören und Lesen"}</dt><dd>${result.best} von ${test.total}</dd></div>
        <div><dt>Lektionen</dt><dd>${doneCount(level)} von ${level.lessons.length}</dd></div>
        <div><dt>Datum</dt><dd>${date}</dd></div>
      </dl>
      <div class="stamp" id="certStamp">Bestanden<small>${date}</small></div>
      <span class="cert-sheen" aria-hidden="true"></span>
    </article>
  </div>
  <p class="muted center small">A record of your own practice. It isn't an official exam result.</p>
  <div style="height:40px"></div>`;
}

/** Slide the certificate in, stamp it, let a light sweep across the paper, and tilt it with the mouse. */
export function mount() {
  const cert = document.getElementById("cert");
  if (!motionOK()) return;
  if (!cert) {
    splitReveal(document.querySelector(".cert-locked"));
    enter("#app > .crumb, #app > .muted, #app > .btn", { y: 12, stagger: 0.08, delay: 0.1 });
    return;
  }
  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
  tl.from(".crumb", { autoAlpha: 0, y: 8, duration: 0.6 }, 0)
    .from(cert, { y: 60, rotationX: 18, autoAlpha: 0, duration: 1.2, transformPerspective: 1400 }, 0.05)
    .from(
      "#certStamp",
      { scale: 2.6, autoAlpha: 0, rotation: -30, duration: 0.55, ease: "back.out(1.8)" },
      0.8,
    )
    .fromTo(
      ".cert-sheen",
      { xPercent: -160, skewX: -14 },
      { xPercent: 420, skewX: -14, duration: 1.4, ease: "power2.inOut" },
      1.05,
    )
    .from("#app > .muted", { autoAlpha: 0, y: 10, duration: 0.8 }, 0.9);
  onLeave(() => tl.kill());
  onLeave(tilt(cert, { max: 5 }));
}
