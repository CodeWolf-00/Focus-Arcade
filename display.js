const KEYS = {
  gif: "fa_gif_dataurl",
  audio: "fa_audio_dataurl",
  trigger: "fa_last_trigger",
};

const bc = ("BroadcastChannel" in window) ? new BroadcastChannel("focus-arcade") : null;

const overlay = document.getElementById("overlay");
const gifEl = document.getElementById("gif");
const msgEl = document.getElementById("msg");
const audioEl = document.getElementById("audio");

let lastTriggerAt = 0;
let hideTimer = null;

function loadAssets() {
  const gif = localStorage.getItem(KEYS.gif);
  const aud = localStorage.getItem(KEYS.audio);

  if (gif) gifEl.src = gif;
  else gifEl.removeAttribute("src");

  if (aud) audioEl.src = aud;
  else audioEl.removeAttribute("src");
}

async function play(trigger = {}) {
  const { durationMs = 4000, message = "" } = trigger;

  loadAssets();

  overlay.hidden = false;

  msgEl.textContent = message || "";
  msgEl.style.display = message ? "block" : "none";

  // restart GIF
  const src = gifEl.getAttribute("src");
  if (src) {
    gifEl.src = "";
    gifEl.src = src;
  }

  // audio (may be blocked until user clicks once)
  try {
    if (audioEl.src) {
      audioEl.currentTime = 0;
      await audioEl.play();
    }
  } catch {
    // autoplay restrictions are normal
  }

  if (hideTimer) clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    overlay.hidden = true;
    audioEl.pause();
  }, durationMs);
}

bc?.addEventListener("message", (ev) => {
  const m = ev.data;
  if (!m?.type) return;

  if (m.type === "TRIGGER") play(m);
  if (m.type === "ASSETS_UPDATED") loadAssets();
});

// fallback polling
setInterval(() => {
  const raw = localStorage.getItem(KEYS.trigger);
  if (!raw) return;

  try {
    const t = JSON.parse(raw);
    if (t?.at && t.at > lastTriggerAt) {
      lastTriggerAt = t.at;
      play(t);
    }
  } catch {}
}, 500);

// unlock audio on first click
window.addEventListener("click", async () => {
  try {
    if (audioEl.src) await audioEl.play();
    audioEl.pause();
    audioEl.currentTime = 0;
  } catch {}
}, { once: true });

loadAssets();
