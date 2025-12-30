// ------------------------------
// Focus Arcade: Progress + Tokens
// ------------------------------
const GOAL = 10;
const PROGRESS_KEY = "focus_arcade_progress";
const USED_TOKENS_KEY = "focus_arcade_used_tokens";

let progress = Number(localStorage.getItem(PROGRESS_KEY) || "0");

const fill = document.getElementById("fill");
const label = document.getElementById("label");
const toast = document.getElementById("toast");

const tap = document.getElementById("tap");       // dev/testing
const reset = document.getElementById("reset");   // dev/testing
const enableSoundBtn = document.getElementById("enableSound");

// ------------------------------
// Celebration / Display Comms
// ------------------------------
const CELEBRATION_KEYS = {
  gif: "fa_gif_dataurl",
  audio: "fa_audio_dataurl",
  trigger: "fa_last_trigger",
};

const bc = ("BroadcastChannel" in window) ? new BroadcastChannel("focus-arcade") : null;

// Controller UI elements
const gifInput = document.getElementById("gifInput");
const audioInput = document.getElementById("audioInput");
const gifPreview = document.getElementById("gifPreview");
const audioPreview = document.getElementById("audioPreview");
const saveBtn = document.getElementById("saveBtn");
const triggerBtn = document.getElementById("triggerBtn");
const messageInput = document.getElementById("messageInput");
const durationInput = document.getElementById("durationInput");

// ------------------------------
// Helpers
// ------------------------------
function replayAnimation(el, className) {
  if (!el) return;
  el.classList.remove(className);
  void el.offsetWidth;
  el.classList.add(className);
}

function showToast(msg) {
  if (!toast) return;
  toast.textContent = msg;
  replayAnimation(toast, "pop");
}

function render() {
  const pct = Math.min(100, Math.round((progress / GOAL) * 100));
  if (fill) {
    fill.style.width = pct + "%";
    replayAnimation(fill, "bump");
  }
  if (label) label.textContent = `Level ${progress} / ${GOAL}`;
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

// ------------------------------
// Sound: simple beep (no file)
// ------------------------------
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

// ------------------------------
// Progress Actions
// ------------------------------
function addOne() {
  progress = Math.min(GOAL, progress + 1);
  localStorage.setItem(PROGRESS_KEY, String(progress));
  render();
  playDing();
  showToast("+1 Focus XP");
}

function resetAll() {
  progress = 0;
  localStorage.setItem(PROGRESS_KEY, "0");
  setUsedTokens([]);
  render();
  showToast("Reset");
}

// ------------------------------
// Token handling
// ------------------------------
function getTokenFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");
  return token ? token.trim() : "";
}

function stripTokenFromUrl() {
  const url = new URL(window.location.href);
  url.searchParams.delete("token");
  window.history.replaceState({}, document.title, url.toString());
}

function redeemTokenOnce(token) {
  if (!token) return false;

  const used = new Set(getUsedTokens());
  if (used.has(token)) {
    showToast(`Already used token: ${token}`);
    return false;
  }

  addOne();
  used.add(token);
  setUsedTokens([...used]);

  showToast(`Redeemed token: ${token}`);
  return true;
}

// ------------------------------
// Loadout (GIF/Audio) Save + Trigger
// ------------------------------
function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onerror = () => reject(new Error("read failed"));
    r.onload = () => resolve(r.result);
    r.readAsDataURL(file);
  });
}

function loadSavedLoadout() {
  const gif = localStorage.getItem(CELEBRATION_KEYS.gif);
  const aud = localStorage.getItem(CELEBRATION_KEYS.audio);

  if (gif && gifPreview) gifPreview.src = gif;
  if (aud && audioPreview) audioPreview.src = aud;
}

async function saveLoadout() {
  const gifFile = gifInput?.files?.[0] || null;
  const audFile = audioInput?.files?.[0] || null;

  // keep existing if user didn't re-upload
  let gif = localStorage.getItem(CELEBRATION_KEYS.gif);
  let aud = localStorage.getItem(CELEBRATION_KEYS.audio);

  if (gifFile) gif = await fileToDataUrl(gifFile);
  if (audFile) aud = await fileToDataUrl(audFile);

  if (!gif && !aud) {
    alert("Upload a GIF or audio first.");
    return;
  }

  if (gif) localStorage.setItem(CELEBRATION_KEYS.gif, gif);
  if (aud) localStorage.setItem(CELEBRATION_KEYS.audio, aud);

  loadSavedLoadout();
  bc?.postMessage({ type: "ASSETS_UPDATED", at: Date.now() });
  showToast("Loadout saved");
}

function triggerCelebration() {
  const duration = Math.max(1, Math.min(30, Number(durationInput?.value || 4)));
  const message = (messageInput?.value || "").trim();

  const payload = {
    type: "TRIGGER",
    at: Date.now(),
    durationMs: duration * 1000,
    message,
  };

  bc?.postMessage(payload);
  localStorage.setItem(CELEBRATION_KEYS.trigger, JSON.stringify(payload));

  showToast("Triggered display");
}

// ------------------------------
// Wire it all up
// ------------------------------
if (enableSoundBtn) {
  enableSoundBtn.addEventListener("click", () => {
    playDing();
    showToast("Sound enabled");
  });
}

if (tap) tap.addEventListener("click", addOne);
if (reset) reset.addEventListener("click", resetAll);

if (saveBtn) saveBtn.addEventListener("click", saveLoadout);
if (triggerBtn) triggerBtn.addEventListener("click", triggerCelebration);

// Redeem token on load (if present)
const token = getTokenFromUrl();
if (redeemTokenOnce(token)) stripTokenFromUrl();

// Init UI
render();
loadSavedLoadout();
