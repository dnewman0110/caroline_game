import * as audio from "./audio.js";
import "./game-starmatch.js";
import "./game-hatch.js";
import "./game-dressup.js";
import "./game-draw.js";

const state = {
  currentScreen: "home",
  muted: false,
};

const screens = {};
document.querySelectorAll(".screen").forEach((el) => {
  const name = el.id.replace("screen-", "");
  screens[name] = el;
});

// Placeholder icons until real bundled art is wired in (Kenney/OpenMoji asset pass).
const PLACEHOLDER_ICONS = {
  draw: "\u{1F3A8}",
  hatch: "\u{1F95A}",
  dressup: "\u{1F451}",
  starmatch: "⭐",
};
Object.entries(PLACEHOLDER_ICONS).forEach(([key, glyph]) => {
  const el = document.getElementById(`btn-icon-${key}`);
  if (el) {
    el.textContent = glyph;
    el.style.fontSize = "min(10vw, 64px)";
    el.style.display = "flex";
    el.style.alignItems = "center";
    el.style.justifyContent = "center";
  }
});

const gameModules = {};

export function registerGameModule(name, mod) {
  gameModules[name] = mod;
}

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

registerGameModule("home", { enter: startSparkles, exit: stopSparkles });
startSparkles();
