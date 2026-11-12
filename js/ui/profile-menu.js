/** A navigation disclosure: native links and Tab, plus arrow-key shortcuts. */
export function initProfileMenu() {
  const root = document.querySelector(".profile-navigation");
  const button = document.getElementById("profile-menu-button");
  const menu = document.getElementById("profile-menu");
  const links = [...menu.querySelectorAll("a")];
  function close(restoreFocus = false) {
    menu.hidden = true;
    button.setAttribute("aria-expanded", "false");
    if (restoreFocus) button.focus();
  }
  function open() {
    menu.hidden = false;
    button.setAttribute("aria-expanded", "true");
  }
  button.addEventListener("click", () => menu.hidden ? open() : close());
  root.addEventListener("keydown", event => {
    if (event.key === "Escape" && !menu.hidden) {
      event.preventDefault();
      event.stopPropagation();
      close(true);
    } else if (["ArrowDown", "ArrowUp"].includes(event.key)) {
      event.preventDefault();
      event.stopPropagation();
      open();
      const index = links.indexOf(document.activeElement);
      const next = index < 0 ? (event.key === "ArrowDown" ? 0 : links.length - 1)
        : (index + (event.key === "ArrowDown" ? 1 : -1) + links.length) % links.length;
      links[next].focus();
    }
  });
  menu.addEventListener("click", event => {
    if (event.target.closest("a")) close(true);
  });
  document.addEventListener("click", event => { if (!root.contains(event.target)) close(); });
  root.addEventListener("focusout", event => { if (!root.contains(event.relatedTarget)) close(); });
  window.addEventListener("hashchange", () => close());
}
