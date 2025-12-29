const GOAL = 10;
const KEY = "focus_arcade_progress";

const fill = document.getElementById("fill");
const label = document.getElementById("label");
const tap = document.getElementById("tap");
const reset = document.getElementById("reset");

let progress = Number(localStorage.getItem(KEY) || "0");

function render() {
  const pct = Math.min(100, Math.round((progress / GOAL) * 100));
  fill.style.width = pct + "%";
  label.textContent = `Level ${progress} / ${GOAL}`;
}

function addOne() {
  progress = Math.min(GOAL, progress + 1);
  localStorage.setItem(KEY, String(progress));
  render();
  // Later: play sound + animation here
}

function doReset() {
  progress = 0;
  localStorage.setItem(KEY, "0");
  render();
}

tap.addEventListener("click", addOne);
reset.addEventListener("click", doReset);

render();
