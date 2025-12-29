// Focus Arcade — Token-based increment (no backend)
// URL example: https://USERNAME.github.io/focus-arcade/?token=abc123

const GOAL = 10;
const PROGRESS_KEY = "focus_arcade_progress";
const USED_TOKENS_KEY = "focus_arcade_used_tokens";

const fill = document.getElementById("fill");
const label = document.getElementById("label");
const tap = document.getElementById("tap");     // optional: keep for manual testing
const reset = document.getElementById("reset"); // optional: keep for dev

let progress = Number(localStorage.getItem(PROGRESS_KEY) || "0");

function getUsedTokens() {
  try {
    return JSON.parse(localStorage.getItem(USED_TOKENS_KEY) || "[]");
  } catch {
    return [];
  }
}

function setUsedTokens(tokens) {
  localStorage.setItem(USED_TOKENS_KEY, JSON.stringify(tokens));
}

function render() {
  const pct = Math.min(100, Math.round((progress / GOAL) * 100));
  fill.style.width = pct + "%";
  label.textContent = `Level ${progress} / ${GOAL}`;
}

function addOne() {
  progress = Math.min(GOAL, progress + 1);
  localStorage.setItem(PROGRESS_KEY, String(progress));
  render();
  // TODO later: sound + animation hook
}

function resetAll() {
  progress = 0;
  localStorage.setItem(PROGRESS_KEY, "0");
  setUsedTokens([]);
  render();
}

// --- Token handling ---
function getTokenFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");
  return token ? token.trim() : "";
}

function redeemTokenOnce(token) {
  if (!token) return false;

  const used = new Set(getUsedTokens());
  if (used.has(token)) return false; // already redeemed on this device/browser

  // Redeem
  addOne();
  used.add(token);
  setUsedTokens([...used]);
  return true;
}

// Optional: clean URL after redeem (removes ?token=... so refresh doesn't re-run logic)
function stripTokenFromUrl() {
  const url = new URL(window.location.href);
  url.searchParams.delete("token");
  window.history.replaceState({}, document.title, url.toString());
}

// --- Wire it up ---
const token = getTokenFromUrl();
const redeemed = redeemTokenOnce(token);
if (redeemed) {
  stripTokenFromUrl();
}

if (tap) tap.addEventListener("click", addOne);
if (reset) reset.addEventListener("click", resetAll);

render();
