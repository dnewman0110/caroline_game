import * as audio from "./audio.js";
import starmatch from "./game-starmatch.js";
import hatch from "./game-hatch.js";
import dressup from "./game-dressup.js";
import draw from "./game-draw.js";

const state = {
  currentScreen: "home",
  muted: false,
};

const screens = {};
document.querySelectorAll(".screen").forEach((el) => {
  const name = el.id.replace("screen-", "");
  screens[name] = el;
});

const HOME_ICONS = {
  draw: "assets/img/stickers/rainbow.svg",
  hatch: "assets/img/stickers/trex.svg",
  dressup: "assets/img/stickers/crown.svg",
  starmatch: "assets/img/stickers/star-glowing.svg",
};
Object.entries(HOME_ICONS).forEach(([key, src]) => {
  const el = document.getElementById(`btn-icon-${key}`);
  if (el) el.style.backgroundImage = `url("${src}")`;
});

export function showScreen(name) {
  if (!screens[name] || name === state.currentScreen) return;

  const outgoing = gameModules[state.currentScreen];
  if (outgoing && typeof outgoing.exit === "function") outgoing.exit();

  screens[state.currentScreen].classList.remove("active");
  screens[name].classList.add("active");
  state.currentScreen = name;

  document.body.classList.toggle("screen-not-home", name !== "home");

  const incoming = gameModules[name];
  if (incoming && typeof incoming.enter === "function") incoming.enter();
}

document.querySelectorAll(".game-btn").forEach((btn) => {
  btn.addEventListener("pointerup", () => showScreen(btn.dataset.screen));
});

document.getElementById("home-toggle").addEventListener("pointerup", () => {
  showScreen("home");
});

const muteToggle = document.getElementById("mute-toggle");
const iconOn = document.getElementById("icon-sound-on");
const iconOff = document.getElementById("icon-sound-off");

function setMuted(muted) {
  state.muted = muted;
  iconOn.hidden = muted;
  iconOff.hidden = !muted;
  audio.setMuted(muted);
}

muteToggle.addEventListener("pointerup", () => setMuted(!state.muted));

// --- Home screen idle sparkles ---
const sparkleField = document.getElementById("home-sparkles");
let sparkleTimer = null;

function spawnSparkle() {
  const el = document.createElement("div");
  el.className = "sparkle";
  const size = 10 + Math.random() * 26;
  el.style.width = `${size}px`;
  el.style.height = `${size}px`;
  el.style.left = `${Math.random() * 100}%`;
  el.style.top = `${Math.random() * 100}%`;
  el.style.animationDuration = `${2.5 + Math.random() * 2}s`;
  sparkleField.appendChild(el);
  setTimeout(() => el.remove(), 5000);
}

function startSparkles() {
  if (sparkleTimer) return;
  spawnSparkle();
  sparkleTimer = setInterval(spawnSparkle, 700);
}

function stopSparkles() {
  clearInterval(sparkleTimer);
  sparkleTimer = null;
  sparkleField.innerHTML = "";
}

// Built after each mini-game module is imported (not via a circular
// self-registration call — game-*.js used to import a registerGameModule
// function from this file and call it at their own module top level,
// which threw "Cannot access 'gameModules' before initialization": the
// function itself hoists fine, but its closure over this const doesn't
// initialize until this line runs, and the circular import invoked it
// earlier than that, while app.js's own evaluation was still paused
// mid-import.
const gameModules = {
  home: { enter: startSparkles, exit: stopSparkles },
  draw,
  hatch,
  dressup,
  starmatch,
};

startSparkles();
