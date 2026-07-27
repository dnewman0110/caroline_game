import { createDraggable } from "./dragdrop.js";
import { registerGameModule } from "./app.js";
import { playStarMatchSuccess } from "./audio.js";

// Hand-coded outline paths (a matched pair per shape reads more clearly as
// a simple glowing solid than borrowed sticker art would here).
const SHAPES = {
  star: {
    path: "M50 5 L61 35 L95 35 L68 55 L79 90 L50 70 L21 90 L32 55 L5 35 L39 35 Z",
    color: "#ffb100",
  },
  moon: {
    path: "M50 10 A40 40 0 1 0 50 90 A32 32 0 1 1 50 10 Z",
    color: "#5fb8ff",
  },
  gem: {
    path: "M15 35 L50 8 L85 35 L67 92 L33 92 Z",
    color: "#ff6fc9",
  },
};

const socketsEl = document.getElementById("starmatch-sockets");
const piecesEl = document.getElementById("starmatch-pieces");

let built = false;

function makeSocketSVG(shapeId) {
  const shape = SHAPES[shapeId];
  return `<svg viewBox="0 0 100 100" class="socket-svg" style="color:${shape.color}">
    <path d="${shape.path}" class="socket-outline" />
  </svg>`;
}

function makePieceSVG(shapeId) {
  const shape = SHAPES[shapeId];
  return `<svg viewBox="0 0 100 100" class="piece-svg">
    <defs>
      <radialGradient id="glow-${shapeId}" cx="50%" cy="38%" r="75%">
        <stop offset="0%" stop-color="#ffffff" />
        <stop offset="45%" stop-color="${shape.color}" />
        <stop offset="100%" stop-color="${shape.color}" />
      </radialGradient>
    </defs>
    <path d="${shape.path}" fill="url(#glow-${shapeId})" class="piece-fill" />
  </svg>`;
}

function burstCelebration(anchorRect) {
  const cx = anchorRect.left + anchorRect.width / 2;
  const cy = anchorRect.top + anchorRect.height / 2;
  for (let i = 0; i < 10; i++) {
    const spark = document.createElement("div");
    spark.className = "sm-spark";
    const angle = (Math.PI * 2 * i) / 10;
    const dist = 40 + Math.random() * 30;
    spark.style.left = `${cx}px`;
    spark.style.top = `${cy}px`;
    spark.style.setProperty("--dx", `${Math.cos(angle) * dist}px`);
    spark.style.setProperty("--dy", `${Math.sin(angle) * dist}px`);
    document.body.appendChild(spark);
    spark.addEventListener("animationend", () => spark.remove());
  }
}

function build() {
  if (built) return;
  built = true;

  Object.keys(SHAPES).forEach((shapeId) => {
    const socket = document.createElement("div");
    socket.className = "sm-socket";
    socket.innerHTML = makeSocketSVG(shapeId);
    socketsEl.appendChild(socket);

    const piece = document.createElement("div");
    piece.className = "sm-piece";
    piece.innerHTML = makePieceSVG(shapeId);
    piecesEl.appendChild(piece);

    createDraggable(piece, {
      toleranceRadius: 90,
      getDropZones: () => {
        const rect = socket.getBoundingClientRect();
        const center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
        return [{ center, anchor: center, tolerance: 90 }];
      },
      onDragStart: () => {
        piece.classList.remove("matched");
        socket.classList.remove("matched");
      },
      onDrop: (el, zone) => {
        if (zone) {
          piece.classList.add("matched");
          socket.classList.add("matched");
          playStarMatchSuccess();
          burstCelebration(socket.getBoundingClientRect());
        }
      },
    });
  });
}

registerGameModule("starmatch", { enter: build });
