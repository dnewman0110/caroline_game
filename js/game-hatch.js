import { registerGameModule } from "./app.js";
import { playEggCrack, playHatchChirp } from "./audio.js";
import { createShuffleBag, randInt, pick } from "./utils.js";

const NUM_SLOTS = 3;
const CRACK_DURATION_MS = 550;
const WANDER_DURATION_MS = 550;
const HATCHED_MIN_MS = 7000;
const HATCHED_MAX_MS = 13000;
const CHIRP_MIN_MS = 4000;
const CHIRP_MAX_MS = 8000;

// Placeholder hand-coded dino designs (shared silhouette, varied color/
// accessory) — swapped for bundled Kenney sprites in the asset pass.
const DINO_TYPES = [
  { id: "meadow", bodyColor: "#8ee0a0", spotColor: "#3f9e5e", accessory: "spikes" },
  { id: "berry", bodyColor: "#ff9fc0", spotColor: "#d94f86", accessory: "horns" },
  { id: "sunshine", bodyColor: "#ffd166", spotColor: "#e08a1e", accessory: "frill" },
  { id: "sky", bodyColor: "#8ecbff", spotColor: "#3f7fd9", accessory: "spikes" },
  { id: "grape", bodyColor: "#c79bff", spotColor: "#8452cf", accessory: "none" },
];

const EGG_ACCENTS = ["#ff9fc0", "#ffd166", "#8ecbff", "#8ee0a0", "#c79bff"];

const ACCESSORY_MARKUP = {
  spikes: (c) =>
    `<polygon points="35,20 42,8 49,20" fill="${c}" /><polygon points="48,16 55,4 62,16" fill="${c}" /><polygon points="61,18 68,7 75,18" fill="${c}" />`,
  horns: () =>
    `<polygon points="78,38 90,32 82,46" fill="#fff8e6" /><polygon points="80,50 93,48 84,60" fill="#fff8e6" />`,
  frill: (c) => `<path d="M60 25 Q85 15 95 40 Q80 45 65 40 Z" fill="${c}" opacity="0.7" />`,
  none: () => "",
};

function dinoSVG({ bodyColor, spotColor, accessory }) {
  const accessoryMarkup = (ACCESSORY_MARKUP[accessory] || ACCESSORY_MARKUP.none)(bodyColor);
  return `<svg viewBox="0 0 110 100" class="dino-svg">
    ${accessoryMarkup}
    <ellipse cx="45" cy="62" rx="34" ry="24" fill="${bodyColor}" />
    <circle cx="82" cy="48" r="16" fill="${bodyColor}" />
    <path d="M14 58 Q0 55 4 70 Q12 68 18 62 Z" fill="${bodyColor}" />
    <ellipse cx="30" cy="82" rx="8" ry="6" fill="${bodyColor}" />
    <ellipse cx="52" cy="84" rx="8" ry="6" fill="${bodyColor}" />
    <circle cx="38" cy="58" r="4" fill="${spotColor}" opacity="0.55" />
    <circle cx="55" cy="70" r="5" fill="${spotColor}" opacity="0.55" />
    <circle cx="62" cy="55" r="3" fill="${spotColor}" opacity="0.55" />
    <circle cx="88" cy="43" r="4.5" fill="#3a2e42" />
    <circle cx="89.5" cy="41.5" r="1.4" fill="#fff" />
  </svg>`;
}

function eggSVG(accent) {
  return `<svg viewBox="0 0 100 120" class="egg-svg">
    <ellipse cx="50" cy="65" rx="38" ry="50" fill="#fff6e8" />
    <path d="M20 50 Q50 30 80 50" stroke="${accent}" stroke-width="7" fill="none" stroke-linecap="round" />
    <path d="M25 82 Q50 65 75 82" stroke="${accent}" stroke-width="7" fill="none" stroke-linecap="round" />
  </svg>`;
}

const slotsContainer = document.getElementById("hatch-slots");
const bag = createShuffleBag(DINO_TYPES);

let slots = [];
let built = false;

function spawnShards(el) {
  const rect = el.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const accent = pick(EGG_ACCENTS);
  for (let i = 0; i < 9; i++) {
    const shard = document.createElement("div");
    shard.className = "hatch-shard";
    shard.style.background = i % 2 === 0 ? "#fff6e8" : accent;
    const angle = Math.random() * Math.PI * 2;
    const dist = 35 + Math.random() * 40;
    shard.style.left = `${cx}px`;
    shard.style.top = `${cy}px`;
    shard.style.setProperty("--dx", `${Math.cos(angle) * dist}px`);
    shard.style.setProperty("--dy", `${Math.sin(angle) * dist}px`);
    shard.style.setProperty("--rot", `${randInt(-180, 180)}deg`);
    document.body.appendChild(shard);
    shard.addEventListener("animationend", () => shard.remove());
  }
}

function onceAnimationEnd(el, name, cb) {
  el.addEventListener(
    "animationend",
    (e) => {
      if (e.animationName === name) cb();
    },
    { once: true }
  );
}

function layEgg(slot) {
  clearTimeout(slot.wanderTimer);
  clearTimeout(slot.chirpTimer);
  slot.state = "egg";
  slot.el.dataset.state = "egg";
  slot.dinoWrap.className = "dino-wrap";
  slot.eggWrap.innerHTML = eggSVG(pick(EGG_ACCENTS));
  slot.eggWrap.className = "egg-wrap egg-pop";
  onceAnimationEnd(slot.eggWrap, "egg-pop-in", () => {
    slot.eggWrap.className = "egg-wrap";
  });
}

function scheduleChirp(slot) {
  clearTimeout(slot.chirpTimer);
  slot.chirpTimer = setTimeout(() => {
    if (slot.state === "hatched") {
      playHatchChirp();
      scheduleChirp(slot);
    }
  }, randInt(CHIRP_MIN_MS, CHIRP_MAX_MS));
}

function scheduleWander(slot) {
  clearTimeout(slot.wanderTimer);
  slot.wanderTimer = setTimeout(() => wander(slot), randInt(HATCHED_MIN_MS, HATCHED_MAX_MS));
}

function wander(slot) {
  if (slot.state !== "hatched") return;
  slot.state = "wander";
  slot.el.dataset.state = "wander";
  clearTimeout(slot.chirpTimer);
  slot.dinoWrap.className = "dino-wrap hatch-wander";
  setTimeout(() => layEgg(slot), WANDER_DURATION_MS);
}

function hatch(slot) {
  slot.state = "hatched";
  slot.el.dataset.state = "hatched";
  const dino = bag.next();
  slot.dinoWrap.innerHTML = dinoSVG(dino);
  slot.dinoWrap.className = "dino-wrap hatch-pop";
  onceAnimationEnd(slot.dinoWrap, "dino-pop-in", () => {
    if (slot.state === "hatched") slot.dinoWrap.className = "dino-wrap hatch-idle";
  });
  scheduleChirp(slot);
  scheduleWander(slot);
}

function crack(slot) {
  if (slot.state !== "egg") return;
  slot.state = "cracking";
  slot.el.dataset.state = "cracking";
  playEggCrack();
  slot.eggWrap.className = "egg-wrap egg-crack";
  spawnShards(slot.el);
  setTimeout(() => hatch(slot), CRACK_DURATION_MS);
}

function onSlotTap(slot) {
  if (slot.state === "egg") {
    crack(slot);
  } else if (slot.state === "hatched") {
    wander(slot);
  }
}

function build() {
  if (built) return;
  built = true;

  for (let i = 0; i < NUM_SLOTS; i++) {
    const el = document.createElement("div");
    el.className = "hatch-slot";
    el.dataset.state = "egg";
    el.innerHTML = `
      <div class="egg-wrap">${eggSVG(pick(EGG_ACCENTS))}</div>
      <div class="dino-wrap"></div>
    `;
    slotsContainer.appendChild(el);

    const slot = {
      el,
      eggWrap: el.querySelector(".egg-wrap"),
      dinoWrap: el.querySelector(".dino-wrap"),
      state: "egg",
      wanderTimer: null,
      chirpTimer: null,
    };
    el.style.setProperty("--wobble-delay", `${Math.random() * 2}s`);
    el.addEventListener("pointerup", () => onSlotTap(slot));

    slots.push(slot);
  }
}

function pauseAll() {
  slots.forEach((slot) => {
    clearTimeout(slot.wanderTimer);
    clearTimeout(slot.chirpTimer);
  });
}

function resumeAll() {
  slots.forEach((slot) => {
    if (slot.state === "hatched") {
      scheduleChirp(slot);
      scheduleWander(slot);
    }
  });
}

function enter() {
  build();
  resumeAll();
}

registerGameModule("hatch", { enter, exit: pauseAll });
