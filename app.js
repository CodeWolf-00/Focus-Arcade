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

const toast = document.getElementById("toast");

let audioCtx = null;
let audioUnlocked = false;

function ensureAudioUnlocked() {
  if (audioUnlocked) return true;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    audioCtx = audioCtx || new AudioCtx();

    // Some browsers require resume() after a gesture
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    audioUnlocked = true;
    return true;
  } catch {
    return false;
  }
}

const enableSoundBtn = document.getElementById("enableSound");
if (enableSoundBtn) {
  enableSoundBtn.addEventListener("click", () => {
    ensureAudioUnlocked();
    showToast("Sound enabled");
    playDing();
  });
}

function playDing() {
  if (!ensureAudioUnlocked()) return;

  // If still suspended, don’t throw—just skip
  if (!audioCtx || audioCtx.state !== "running") return;

  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = "sine";
  o.frequency.value = 880;
  g.gain.value = 0.06;

  o.connect(g);
  g.connect(audioCtx.destination);

  o.start();
  o.stop(audioCtx.currentTime + 0.08);
}

// tiny inline beep (no audio file needed)
function playDing() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioCtx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = 880;
    g.gain.value = 0.06;
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.08);
    o.onended = () => ctx.close();
  } catch {}
}

function showToast(msg) {
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.remove("pop");
  // reflow to restart animation
  void toast.offsetWidth;
  toast.classList.add("pop");
}

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
  
function replayAnimation(el, className) {
  if (!el) return;
  el.classList.remove(className);
  void el.offsetWidth;
  el.classList.add(className);
}

replayAnimation(toast, "pop");
replayAnimation(fill, "bump");

function addOne() {
  progress = Math.min(GOAL, progress + 1);
  localStorage.setItem(PROGRESS_KEY, String(progress));
  render();

  replayAnimation(fill, "bump");
  showToast("+1 Focus XP");
  playDing();
}

  playDing();
  showToast("+1 Focus XP");
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
  if (used.has(token)) return false;

  // Redeem
  addOne();
  showToast(`Redeemed token: ${token}`);

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
