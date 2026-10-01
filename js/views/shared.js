// Pieces used by several pages.

import { LEVELS } from "../content.js";
import { esc } from "../utils.js";

/** A1 / A2 / B1 buttons. `path` is appended to each level link, e.g. "/test". */
export const levelSwitch = (active, path, label) =>
  `<nav class="lvswitch" aria-label="${esc(label)}">${LEVELS.map(
    (lv) => `<a href="#/${lv.id}${path}"${lv === active ? ' aria-current="true"' : ""}>${lv.name}</a>`,
  ).join("")}</nav>`;

/** Breadcrumb: level / current page. */
export const breadcrumb = (level, here) =>
  `<nav class="crumb" aria-label="Breadcrumb"><a href="#/${level.id}">${level.name}</a> <span aria-hidden="true">/</span> ${esc(here)}</nav>`;
