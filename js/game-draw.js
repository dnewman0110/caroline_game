import { playStickerStamp, playClearPoof } from "./audio.js";

const STORAGE_KEY = "sparkle-roar-drawing";
const STROKE_WIDTH = 14;
const STAMP_SIZE = 72;

const COLORS = [
  "#ef4444", // red
  "#ff8c1a", // orange
  "#ffb400", // amber
  "#ffe066", // yellow
  "#b0e63c", // lime
  "#4cd97b", // green
  "#16a86e", // emerald
  "#14b8a6", // teal
  "#22d3ee", // cyan
  "#4aa8ff", // sky blue
  "#3366ff", // blue
  "#5b5bd6", // indigo
  "#8b5cf6", // violet
  "#b374ff", // purple
  "#e347c9", // magenta
  "#ff5b7f", // pink
  "#ff2d78", // rose
  "#a5652f", // brown
  "#2b2b2b", // black
  "#ffffff", // white
];

const STICKERS = [
  { id: "unicorn", src: "assets/img/stickers/unicorn.svg" },
  { id: "dino", src: "assets/img/stickers/trex.svg" },
  { id: "crown", src: "assets/img/stickers/crown.svg" },
  { id: "rainbow", src: "assets/img/stickers/rainbow.svg" },
  { id: "star", src: "assets/img/stickers/star-glowing.svg" },
];

const canvas = document.getElementById("draw-canvas");
const ctx = canvas.getContext("2d");
const swatchesEl = document.getElementById("draw-swatches");
const stickersEl = document.getElementById("draw-stickers");
const clearBtn = document.getElementById("draw-clear");

let built = false;
let displayList = [];
let currentColor = COLORS[0];
let selectedSticker = null;
let currentStroke = null;
let activePointerId = null;
let renderScheduled = false;

const stickerImages = {};

function loadDrawing() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) displayList = JSON.parse(raw);
  } catch (e) {
    displayList = [];
  }
}

function saveDrawing() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(displayList));
  } catch (e) {
    // storage unavailable (e.g. private browsing) — drawing just won't persist
  }
}

function scheduleRender() {
  if (renderScheduled) return;
  renderScheduled = true;
  requestAnimationFrame(() => {
    renderScheduled = false;
    render();
  });
}

function render() {
  const rect = canvas.getBoundingClientRect();
  ctx.clearRect(0, 0, rect.width, rect.height);
  displayList.forEach((item) => {
    if (item.type === "stroke") drawStroke(item);
    else drawStamp(item);
  });
}

function drawStroke({ color, points }) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = STROKE_WIDTH;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  if (points.length < 2) {
    ctx.beginPath();
    ctx.arc(points[0].x, points[0].y, STROKE_WIDTH / 2, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length - 1; i++) {
    const mx = (points[i].x + points[i + 1].x) / 2;
    const my = (points[i].y + points[i + 1].y) / 2;
    ctx.quadraticCurveTo(points[i].x, points[i].y, mx, my);
  }
  ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
  ctx.stroke();
}

function drawStamp({ stickerId, x, y }) {
  const img = stickerImages[stickerId];
  if (!img || !img.complete || img.naturalWidth === 0) return;
  ctx.drawImage(img, x - STAMP_SIZE / 2, y - STAMP_SIZE / 2, STAMP_SIZE, STAMP_SIZE);
}

function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.max(1, Math.round(rect.width * dpr));
  canvas.height = Math.max(1, Math.round(rect.height * dpr));
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  render();
}

function getPos(e) {
  const rect = canvas.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

function placeStamp(pos) {
  displayList.push({ type: "stamp", stickerId: selectedSticker, x: pos.x, y: pos.y });
  playStickerStamp();
  scheduleRender();
  saveDrawing();
}

function onPointerDown(e) {
  if (activePointerId !== null) return;
  const pos = getPos(e);

  if (selectedSticker) {
    placeStamp(pos);
    return;
  }

  activePointerId = e.pointerId;
  canvas.setPointerCapture(activePointerId);
  currentStroke = { type: "stroke", color: currentColor, points: [pos] };
  displayList.push(currentStroke);
  scheduleRender();
}

function onPointerMove(e) {
  if (e.pointerId !== activePointerId || !currentStroke) return;
  currentStroke.points.push(getPos(e));
  scheduleRender();
}

function endStroke(e) {
  if (e.pointerId !== activePointerId) return;
  canvas.releasePointerCapture(activePointerId);
  activePointerId = null;
  if (currentStroke) saveDrawing();
  currentStroke = null;
}

function burstAt(rect, colorList) {
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  for (let i = 0; i < 12; i++) {
    const spark = document.createElement("div");
    spark.className = "draw-spark";
    const angle = Math.random() * Math.PI * 2;
    const dist = 40 + Math.random() * 50;
    spark.style.left = `${cx}px`;
    spark.style.top = `${cy}px`;
    spark.style.background = colorList
      ? `radial-gradient(circle, #fff, ${colorList[i % colorList.length]} 60%, transparent 75%)`
      : "";
    spark.style.setProperty("--dx", `${Math.cos(angle) * dist}px`);
    spark.style.setProperty("--dy", `${Math.sin(angle) * dist}px`);
    document.body.appendChild(spark);
    spark.addEventListener("animationend", () => spark.remove());
  }
}

function clearCanvas() {
  displayList = [];
  scheduleRender();
  saveDrawing();
  playClearPoof();
  burstAt(clearBtn.getBoundingClientRect(), COLORS);
}

function selectColor(color, btn) {
  currentColor = color;
  selectedSticker = null;
  swatchesEl.querySelectorAll(".draw-swatch").forEach((el) => el.classList.remove("active"));
  btn.classList.add("active");
  stickersEl.querySelectorAll(".draw-sticker-btn").forEach((el) => el.classList.remove("active"));
}

function selectSticker(id, btn) {
  const alreadyActive = selectedSticker === id;
  stickersEl.querySelectorAll(".draw-sticker-btn").forEach((el) => el.classList.remove("active"));
  selectedSticker = alreadyActive ? null : id;
  if (selectedSticker) btn.classList.add("active");
}

function build() {
  if (built) return;
  built = true;

  loadDrawing();

  COLORS.forEach((color, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "draw-swatch";
    if (i === 0) btn.classList.add("active");
    btn.style.background = color;
    btn.setAttribute("aria-label", "color");
    btn.addEventListener("pointerup", () => selectColor(color, btn));
    swatchesEl.appendChild(btn);
  });

  const customBtn = document.createElement("button");
  customBtn.type = "button";
  customBtn.className = "draw-swatch draw-swatch-custom";
  customBtn.setAttribute("aria-label", "custom color");
  swatchesEl.appendChild(customBtn);

  const customInput = document.createElement("input");
  customInput.type = "color";
  customInput.className = "draw-swatch-custom-input";
  customInput.value = "#ff5b7f";
  customInput.setAttribute("aria-hidden", "true");
  customInput.tabIndex = -1;
  swatchesEl.appendChild(customInput);

  customBtn.addEventListener("pointerup", () => customInput.click());
  customInput.addEventListener("input", () => {
    customBtn.style.background = customInput.value;
    selectColor(customInput.value, customBtn);
  });

  STICKERS.forEach((sticker) => {
    const img = new Image();
    img.src = sticker.src;
    img.onload = scheduleRender;
    stickerImages[sticker.id] = img;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "draw-sticker-btn";
    btn.innerHTML = `<img src="${sticker.src}" alt="" draggable="false" />`;
    btn.setAttribute("aria-label", sticker.id);
    btn.addEventListener("pointerup", () => selectSticker(sticker.id, btn));
    stickersEl.appendChild(btn);
  });

  clearBtn.addEventListener("pointerup", clearCanvas);

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", endStroke);
  canvas.addEventListener("pointercancel", endStroke);

  window.addEventListener("resize", resizeCanvas);
}

function enter() {
  build();
  resizeCanvas();
}

function exit() {
  if (activePointerId !== null) {
    try {
      canvas.releasePointerCapture(activePointerId);
    } catch (e) {
      // pointer may already be released
    }
  }
  activePointerId = null;
  currentStroke = null;
}

export default { enter, exit };
