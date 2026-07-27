// Reusable pointer-based drag-and-drop with radius-tolerance snap zones.
// The dragged element is never reparented; it's moved purely via a CSS
// transform relative to its resting position, which stays correct across
// resizes/orientation changes because rects are recomputed on every drag.

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function rectCenter(rect) {
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

export function createDraggable(
  element,
  {
    getDropZones,
    toleranceRadius = 80,
    onDragStart = () => {},
    onDragMove = () => {},
    onDrop = () => {},
  }
) {
  element.style.touchAction = "none";

  let pointerId = null;
  let originLeft = 0;
  let originTop = 0;
  let grabDx = 0;
  let grabDy = 0;
  let currentX = 0;
  let currentY = 0;

  function setTransform(x, y, transition) {
    element.style.transition = transition
      ? "transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)"
      : "none";
    element.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  }

  function onPointerDown(e) {
    if (pointerId !== null) return;
    pointerId = e.pointerId;
    element.setPointerCapture(pointerId);

    const rect = element.getBoundingClientRect();
    originLeft = rect.left - currentX;
    originTop = rect.top - currentY;
    grabDx = e.clientX - rect.left;
    grabDy = e.clientY - rect.top;

    element.classList.add("dragging");
    setTransform(currentX, currentY, false);
    onDragStart(element);

    element.addEventListener("pointermove", onPointerMove);
    element.addEventListener("pointerup", onPointerUp);
    element.addEventListener("pointercancel", onPointerUp);
  }

  function onPointerMove(e) {
    if (e.pointerId !== pointerId) return;
    currentX = e.clientX - grabDx - originLeft;
    currentY = e.clientY - grabDy - originTop;
    setTransform(currentX, currentY, false);
    onDragMove(element, { x: e.clientX, y: e.clientY });
  }

  function onPointerUp(e) {
    if (e.pointerId !== pointerId) return;
    element.releasePointerCapture(pointerId);
    element.removeEventListener("pointermove", onPointerMove);
    element.removeEventListener("pointerup", onPointerUp);
    element.removeEventListener("pointercancel", onPointerUp);
    pointerId = null;
    element.classList.remove("dragging");

    const rect = element.getBoundingClientRect();
    const center = rectCenter(rect);

    const zones = getDropZones();
    let bestZone = null;
    let bestDist = Infinity;
    for (const zone of zones) {
      const d = distance(center, zone.center);
      const radius = zone.tolerance ?? toleranceRadius;
      if (d <= radius && d < bestDist) {
        bestDist = d;
        bestZone = zone;
      }
    }

    if (bestZone) {
      const anchor = bestZone.anchor || bestZone.center;
      const targetX = currentX + (anchor.x - center.x);
      const targetY = currentY + (anchor.y - center.y);
      currentX = targetX;
      currentY = targetY;
      setTransform(currentX, currentY, true);
      onDrop(element, bestZone);
    } else {
      currentX = 0;
      currentY = 0;
      setTransform(0, 0, true);
      onDrop(element, null);
    }
  }

  element.addEventListener("pointerdown", onPointerDown);

  return {
    destroy() {
      element.removeEventListener("pointerdown", onPointerDown);
      element.removeEventListener("pointermove", onPointerMove);
      element.removeEventListener("pointerup", onPointerUp);
      element.removeEventListener("pointercancel", onPointerUp);
    },
    reset() {
      currentX = 0;
      currentY = 0;
      setTransform(0, 0, false);
    },
  };
}
