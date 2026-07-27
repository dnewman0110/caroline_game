import { createDraggable } from "./dragdrop.js";
import { registerGameModule } from "./app.js";
import { playAccessoryPlace } from "./audio.js";
import { randInt } from "./utils.js";

const ACCESSORY_SIZE = 68;

// Fractional anchor points within the character's own bounding box.
const ANCHORS = {
  head: { x: 0.5, y: 0.08 },
  side: { x: 0.73, y: 0.17 },
  back: { x: 0.5, y: 0.47 },
  lowerback: { x: 0.58, y: 0.72 },
  chest: { x: 0.5, y: 0.44 },
};

function hornSVG() {
  return `<svg viewBox="0 0 72 72" class="acc-svg">
    <polygon points="36,4 48,66 24,66" fill="#ffe37a" stroke="#e0ac2e" stroke-width="2" stroke-linejoin="round" />
    <path d="M28 20 L44 24 M27 34 L45 39 M27 48 L44 53" stroke="#e0ac2e" stroke-width="2" fill="none" stroke-linecap="round" />
  </svg>`;
}

function spikesSVG() {
  return `<svg viewBox="0 0 72 72" class="acc-svg">
    <polygon points="10,60 18,30 26,60" fill="#8ee0a0" stroke="#3f9e5e" stroke-width="2" stroke-linejoin="round" />
    <polygon points="26,62 36,22 46,62" fill="#8ee0a0" stroke="#3f9e5e" stroke-width="2" stroke-linejoin="round" />
    <polygon points="46,60 54,32 62,60" fill="#8ee0a0" stroke="#3f9e5e" stroke-width="2" stroke-linejoin="round" />
  </svg>`;
}

function tailSVG() {
  return `<svg viewBox="0 0 72 72" class="acc-svg">
    <path d="M10 40 Q30 10 62 20 Q45 28 40 45 Q55 42 62 55 Q40 60 25 50 Q12 46 10 40 Z" fill="#c79bff" stroke="#8452cf" stroke-width="2" stroke-linejoin="round" />
  </svg>`;
}

const ACCESSORIES = [
  { id: "crown", src: "assets/img/stickers/crown.svg", anchor: "head" },
  { id: "horn", markup: hornSVG(), anchor: "head" },
  { id: "bow", src: "assets/img/stickers/bow.svg", anchor: "side" },
  { id: "spikes", markup: spikesSVG(), anchor: "back" },
  { id: "tail", markup: tailSVG(), anchor: "lowerback" },
  { id: "gem", src: "assets/img/stickers/gem.svg", anchor: "chest" },
];

const CHARACTER_SVG = `<svg viewBox="0 0 200 320" id="char-svg">
  <rect x="65" y="230" width="30" height="80" rx="15" fill="#ffe3c2" stroke="#f0c896" stroke-width="3" />
  <rect x="105" y="230" width="30" height="80" rx="15" fill="#ffe3c2" stroke="#f0c896" stroke-width="3" />
  <rect x="60" y="120" width="80" height="120" rx="40" fill="#ffe3c2" stroke="#f0c896" stroke-width="3" />
  <rect x="35" y="130" width="28" height="90" rx="14" fill="#ffe3c2" stroke="#f0c896" stroke-width="3" />
  <rect x="137" y="130" width="28" height="90" rx="14" fill="#ffe3c2" stroke="#f0c896" stroke-width="3" />
  <ellipse cx="100" cy="70" rx="42" ry="46" fill="#ffe3c2" stroke="#f0c896" stroke-width="3" />
  <circle cx="85" cy="65" r="5" fill="#caa27a" />
  <circle cx="115" cy="65" r="5" fill="#caa27a" />
  <path d="M85 88 Q100 96 115 88" stroke="#caa27a" stroke-width="4" fill="none" stroke-linecap="round" />
</svg>`;

const characterEl = document.getElementById("dressup-character");
const trayEl = document.getElementById("dressup-tray");
const fixedLayer = document.getElementById("dressup-fixed-layer");

let built = false;

function accessoryContent(acc) {
  return acc.src ? `<img src="${acc.src}" alt="" draggable="false" />` : acc.markup;
}

function anchorPoint(anchorId) {
  const rect = characterEl.getBoundingClientRect();
  const a = ANCHORS[anchorId];
  return { x: rect.left + rect.width * a.x, y: rect.top + rect.height * a.y };
}

function shimmer(point) {
  for (let i = 0; i < 6; i++) {
    const spark = document.createElement("div");
    spark.className = "dressup-shimmer";
    const angle = Math.random() * Math.PI * 2;
    const dist = 18 + Math.random() * 20;
    spark.style.left = `${point.x}px`;
    spark.style.top = `${point.y}px`;
    spark.style.setProperty("--dx", `${Math.cos(angle) * dist}px`);
    spark.style.setProperty("--dy", `${Math.sin(angle) * dist}px`);
    document.body.appendChild(spark);
    spark.addEventListener("animationend", () => spark.remove());
  }
}

function spawnAccessory(acc, spawnPoint) {
  const clone = document.createElement("div");
  clone.className = "dressup-accessory";
  clone.innerHTML = accessoryContent(acc);
  clone.style.width = `${ACCESSORY_SIZE}px`;
  clone.style.height = `${ACCESSORY_SIZE}px`;
  clone.style.left = `${spawnPoint.x - ACCESSORY_SIZE / 2}px`;
  clone.style.top = `${spawnPoint.y - ACCESSORY_SIZE / 2}px`;
  fixedLayer.appendChild(clone);

  return createDraggable(clone, {
    toleranceRadius: 150,
    getDropZones: () => {
      const anchor = anchorPoint(acc.anchor);
      return [
        {
          center: anchor,
          anchor: { x: anchor.x + randInt(-10, 10), y: anchor.y + randInt(-10, 10) },
        },
      ];
    },
    onDrop: (el, zone) => {
      if (zone) {
        playAccessoryPlace();
        shimmer(zone.anchor);
      } else {
        el.remove();
      }
    },
  });
}

function build() {
  if (built) return;
  built = true;

  characterEl.innerHTML = CHARACTER_SVG;

  ACCESSORIES.forEach((acc) => {
    const trayItem = document.createElement("button");
    trayItem.type = "button";
    trayItem.className = "dressup-tray-item";
    trayItem.innerHTML = accessoryContent(acc);
    trayItem.setAttribute("aria-label", acc.id);
    trayEl.appendChild(trayItem);

    trayItem.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      const spawnPoint = { x: e.clientX, y: e.clientY };
      const controller = spawnAccessory(acc, spawnPoint);
      controller.beginDrag(e);
    });
  });
}

function show() {
  fixedLayer.style.display = "block";
}

function hide() {
  fixedLayer.style.display = "none";
}

registerGameModule("dressup", {
  enter() {
    build();
    show();
  },
  exit: hide,
});
