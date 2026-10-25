// Remember the guest's welcome-screen choice for this tab, including reloads.
// Learning progress remains in state.js; this flag only controls the entry screen.
const GUEST_ENTRY_KEY = "sprachpfad-guest-entry";
let guestEntered = false;

try { guestEntered = sessionStorage.getItem(GUEST_ENTRY_KEY) === "1"; }
catch { /* The current tab can still continue when browser storage is unavailable. */ }

export const hasEnteredAsGuest = () => guestEntered;

export function enterAsGuest() {
  guestEntered = true;
  try { sessionStorage.setItem(GUEST_ENTRY_KEY, "1"); } catch { /* Keep the in-memory choice. */ }
}

export function clearGuestEntry() {
  guestEntered = false;
  try { sessionStorage.removeItem(GUEST_ENTRY_KEY); } catch { /* Keep the in-memory choice. */ }
}
