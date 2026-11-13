// Hash routes → page views.
//
//   #/                      home, showing the level you last worked on
//   #/a2                    home for a level
//   #/a2/lektion/3          lesson
//   #/a2/test               mock test
//   #/a2/zertifikat         certificate
//   #/karten?l=a2-3         flashcards (l: due, all, a level or a lesson)
//   #/profile               practice calendar, level progress and test results
//
// Pages read their own options from the query (?part=exercises on a lesson, ?l= on flashcards).
//
// Links from the A1-only version (#/lektion/3, #/test, #/zertifikat) are rewritten to the new shape.

import { LEVEL_BY_ID } from "./content.js";
import { currentLevel, setLevel, sitePreferences } from "./state.js";
import { refreshInterface } from "./study-language.js";
import { setStudyView } from "./study-clock.js";
import { currentUser } from "./auth.js";
import { hasEnteredAsGuest } from "./entry.js";
import { progressStatus } from "./progress.js";
import { updateDueBadges } from "./ui/duebadge.js";
import { applyDisplayPreferences, gsap, motionOK, onLeave, runCleanups, ScrollTrigger } from "./ui/motion.js?v=20261113-polish1";
import { initSmoothScroll, scrollToTop } from "./ui/scroll.js?v=20261113-polish1";
import * as cards from "./views/cards.js?v=20261113-polish1";
import * as cert from "./views/cert.js?v=20261113-polish1";
import * as home from "./views/home.js?v=20261112-shortcuts2";
import * as lesson from "./views/lesson.js?v=20261113-polish1";
import * as notFound from "./views/notfound.js?v=20261113-polish1";
import * as practice from "./views/practice.js?v=20261113-polish1";
import * as profile from "./views/profile.js?v=20261113-polish1";
import * as roadmap from "./views/roadmap.js?v=20261112-weekcards1";
import * as test from "./views/test.js?v=20261113-polish1";
import * as workshop from "./views/workshop.js?v=20261108-home1";
import * as account from "./views/account.js?v=20261104-settings1";
import * as settings from "./views/settings.js?v=20261113-signout1";
import * as sentences from "./views/sentences.js?v=20261113-polish1";

let active = null;
let firstRoute = true;

/** The view on screen; main.js passes clicks and key presses to it. */
export const activeView = () => active;

/** Replace the address without adding a history entry. */
function rewrite(path) {
  try {
    history.replaceState(null, "", `#${path}`);
  } catch (e) {
    location.replace(`#${path}`);
  }
  return path;
}

function resolve() {
  let path = location.hash.replace(/^#/, "") || "/";
  if (!currentUser() && !hasEnteredAsGuest()) path = rewrite("/login");
  if (currentUser() && progressStatus().blocked && path.split("?")[0] !== "/settings") {
    return { path, view: account, param: "status", nav: "profile", title: "Your account" };
  }
  if (path.split("?")[0] === "/login" && currentUser()) path = rewrite("/");
  const oldLesson = path.match(/^\/lektion\/(\d+)$/);
  if (oldLesson) path = rewrite(`/a1/lektion/${oldLesson[1]}`);
  else if (path === "/zertifikat") path = rewrite("/a1/zertifikat");
  else if (path === "/test") path = rewrite(`/${currentLevel().id}/test`);
  else if (path.split("?")[0] === "/practice-hub") path = rewrite("/practice");

  return { path, ...match(path.split("?")[0]) };
}

function match(path) {
  if (path === "/login") return { view: account, param: "login", nav: "profile", title: "Sign in" };
  if (path === "/") return { view: home, param: currentLevel(), nav: "home" };
  if (path === "/karten") return { view: cards, nav: "karten", title: "Flashcards" };
  if (path === "/practice") return { view: practice, param: currentLevel(), nav: "exercises", title: "Practice" };
  if (path === "/sentences") return { view: sentences, nav: "sentences", title: "Sentence practice" };
  if (path === "/profile") return { view: profile, param: currentLevel(), nav: "profile", title: "Your profile" };
  if (path === "/settings") return { view: settings, nav: "settings", title: "Settings" };
  if (path === "/roadmap") return { view: roadmap, param: currentLevel(), nav: "lessons", title: `${currentLevel().name} lessons` };

  const [, id, rest = ""] = path.match(/^\/([a-z0-9]+)(\/.*)?$/) || [];
  const level = LEVEL_BY_ID[id];
  if (level) {
    if (rest === "") {
      setLevel(level);
      return { view: home, param: level, nav: "home", title: `${level.name} line` };
    }
    const m = rest.match(/^\/lektion\/(\d+)$/);
    const l = m && level.lessons.find((x) => x.id === +m[1]);
    if (l) {
      setLevel(level);
      return {
        view: lesson,
        param: l,
        nav: "lessons",
        title: `${l.germanTitle} (${level.name}, lesson ${l.position})`,
      };
    }
    if (rest === "/test") {
      setLevel(level);
      return { view: test, param: level, nav: "test", title: `${level.name} mock test` };
    }
    if (rest === "/practice") {
      setLevel(level);
      return { view: practice, param: level, nav: "exercises", title: `${level.name} practice` };
    }
    if (rest === "/roadmap") {
      setLevel(level);
      return { view: roadmap, param: level, nav: "lessons", title: `${level.name} lessons` };
    }
    const checkpoint = rest.match(/^\/checkpoint\/(\d+)$/);
    const module = checkpoint && level.course?.modules.find(item => item.id === +checkpoint[1]);
    if (module?.workshop) {
      setLevel(level);
      return { view: workshop, param: { level, module }, nav: "lessons", title: `${level.name} module ${module.id} practice` };
    }
    if (rest === "/zertifikat")
      return { view: cert, param: level, nav: "test", title: `${level.name} certificate` };
  }
  return { view: notFound, title: "Page not found" };
}

let leaving = null; // the fade-out of the previous page, if one is running

/**
 * Show the page for the current address. Moving to a different kind of page fades the old one out
 * first; switching level on the same kind of page (home, test, flashcards) lets that page animate
 * the change itself.
 */
export function route(options = {}) {
  const next = resolve();
  const app = document.getElementById("app");
  const from = active;
  leaving?.kill();
  leaving = null;
  const sameKind = from === next.view && next.view.updatesInPlace;
  const animateEnter = !options.immediate && motionOK() && !sameKind;
  if (!options.immediate && motionOK() && !firstRoute && !sameKind && app.firstElementChild) {
    app.classList.add("is-leaving");
    leaving = gsap.to(app, {
      autoAlpha: 0,
      y: -5,
      duration: 0.12,
      ease: "power2.in",
      onComplete: () => {
        leaving = null;
        show(next, from, { animateEnter: true });
      },
    });
  } else {
    show(next, from, { animateEnter });
  }
}

function show({ view, param, nav = "", title = "German A1–B1 practice", path }, from, { animateEnter = false } = {}) {
  const app = document.getElementById("app");
  setStudyView([cards, lesson, practice, sentences, test, workshop].includes(view));
  runCleanups();
  from?.unmount?.();
  app.classList.remove("is-leaving");
  gsap?.set(app, { clearProps: "opacity,visibility,transform" });
  document.body.classList.toggle("entry-screen", view === account);
  document.documentElement.lang = sitePreferences().appLanguage;
  applyDisplayPreferences();
  initSmoothScroll();
  app.innerHTML = view.render(param);
  if (animateEnter && motionOK()) {
    const tween = gsap.from(app, {
      autoAlpha: 0,
      y: 6,
      duration: 0.24,
      ease: "power3.out",
      clearProps: "opacity,visibility,transform",
    });
    onLeave(() => tween.kill());
  }
  app.dataset.route = path;
  active = view;
  document.title = `${title} | Sprachpfad`;
  document.querySelectorAll("[data-nav]").forEach((a) => {
    if (a.dataset.nav === nav) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
  updateDueBadges();
  refreshInterface(document.querySelector("header.nav"));
  refreshInterface(app);
  scrollToTop();
  view.mount?.(param, { from, first: firstRoute, sameKind: from === view });
  ScrollTrigger?.refresh();
  // Move focus to the new page, unless the page itself put it somewhere (e.g. back on a menu just used)
  const placed = document.activeElement !== app && app.contains(document.activeElement);
  if (!firstRoute && !placed) app.focus({ preventScroll: true });
  firstRoute = false;
}

/** Re-measure things that depend on layout (after fonts load or the window resizes). */
export function relayout() {
  ScrollTrigger?.refresh();
}
