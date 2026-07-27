export function rand(min, max) {
  return min + Math.random() * (max - min);
}

export function randInt(min, max) {
  return Math.floor(rand(min, max + 1));
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

// Cycles through `items` in random order with no immediate repeats,
// reshuffling once exhausted.
export function createShuffleBag(items) {
  let bag = [];
  let last = null;

  function refill() {
    bag = [...items];
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
    if (bag.length > 1 && bag[0] === last) {
      [bag[0], bag[1]] = [bag[1], bag[0]];
    }
  }

  return {
    next() {
      if (bag.length === 0) refill();
      const item = bag.pop();
      last = item;
      return item;
    },
  };
}
