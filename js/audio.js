let ctx = null;
let masterGain = null;
let musicGain = null;
let sfxGain = null;
let noiseBuffer = null;
let muted = false;

function createNoiseBuffer() {
  const length = ctx.sampleRate; // 1 second of noise, reused/sliced for every noise SFX
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

function ensureContext() {
  if (ctx) return;
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  ctx = new AudioContextCtor();

  masterGain = ctx.createGain();
  masterGain.gain.value = muted ? 0 : 1;
  masterGain.connect(ctx.destination);

  musicGain = ctx.createGain();
  musicGain.gain.value = 0.35;
  musicGain.connect(masterGain);

  sfxGain = ctx.createGain();
  sfxGain.gain.value = 0.9;
  sfxGain.connect(masterGain);

  noiseBuffer = createNoiseBuffer();
}

function unlock() {
  ensureContext();
  if (ctx.state === "suspended") ctx.resume();
  startMusic();
}
document.addEventListener("pointerdown", unlock, { once: true });
document.addEventListener("visibilitychange", () => {
  if (ctx && document.visibilityState === "visible" && ctx.state === "suspended") {
    ctx.resume();
  }
});

export function setMuted(isMuted) {
  muted = isMuted;
  if (!ctx) return;
  masterGain.gain.setTargetAtTime(muted ? 0 : 1, ctx.currentTime, 0.01);
}

// --- low-level synthesis primitives ---

function playTone({
  freq = 440,
  freqEnd = null,
  type = "sine",
  start = 0,
  duration = 0.3,
  attack = 0.01,
  decay = 0.05,
  sustain = 0.6,
  release = 0.15,
  peak = 0.4,
  destination = null,
} = {}) {
  if (!ctx) return;
  const t0 = ctx.currentTime + start;
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (freqEnd) osc.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 1), t0 + duration);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(peak, t0 + attack);
  gain.gain.linearRampToValueAtTime(peak * sustain, t0 + attack + decay);
  const stopAt = t0 + duration;
  gain.gain.setTargetAtTime(0, stopAt - release, Math.max(release / 3, 0.01));

  osc.connect(gain);
  gain.connect(destination || sfxGain);
  osc.start(t0);
  osc.stop(stopAt + release * 2);
  osc.onended = () => {
    osc.disconnect();
    gain.disconnect();
  };
}

function playNoiseBurst({
  start = 0,
  duration = 0.2,
  filterFreq = 1200,
  filterType = "bandpass",
  q = 1,
  peak = 0.6,
  destination = null,
} = {}) {
  if (!ctx) return;
  const t0 = ctx.currentTime + start;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer;

  const filter = ctx.createBiquadFilter();
  filter.type = filterType;
  filter.frequency.value = filterFreq;
  filter.Q.value = q;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(peak, t0);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);

  src.connect(filter);
  filter.connect(gain);
  gain.connect(destination || sfxGain);
  src.start(t0);
  src.stop(t0 + duration + 0.05);
  src.onended = () => {
    src.disconnect();
    filter.disconnect();
    gain.disconnect();
  };
}

// --- per-interaction sound effects ---

export function playEggCrack() {
  ensureContext();
  playNoiseBurst({ duration: 0.18, filterFreq: 1800, filterType: "bandpass", q: 0.7, peak: 0.7 });
  playTone({ freq: 180, freqEnd: 520, type: "square", start: 0.02, duration: 0.22, attack: 0.005, decay: 0.05, sustain: 0.3, release: 0.1, peak: 0.3 });
}

export function playStickerStamp() {
  ensureContext();
  playTone({ freq: 520, type: "triangle", duration: 0.09, attack: 0.005, decay: 0.03, sustain: 0.4, release: 0.05, peak: 0.4 });
  playTone({ freq: 700, type: "triangle", start: 0.06, duration: 0.09, attack: 0.005, decay: 0.03, sustain: 0.4, release: 0.05, peak: 0.35 });
}

export function playAccessoryPlace() {
  ensureContext();
  [660, 880, 990].forEach((freq, i) => {
    playTone({ freq, type: "sine", start: i * 0.07, duration: 0.35, attack: 0.01, decay: 0.1, sustain: 0.5, release: 0.2, peak: 0.3 });
  });
}

export function playStarMatchSuccess() {
  ensureContext();
  const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
  notes.forEach((freq, i) => {
    playTone({ freq, type: "triangle", start: i * 0.06, duration: 0.4, attack: 0.005, decay: 0.08, sustain: 0.5, release: 0.25, peak: 0.35 });
  });
  playTone({ freq: 1760, type: "sine", start: 0.3, duration: 0.5, attack: 0.02, decay: 0.1, sustain: 0.3, release: 0.3, peak: 0.2 });
}

export function playClearPoof() {
  ensureContext();
  playNoiseBurst({ duration: 0.35, filterFreq: 900, filterType: "lowpass", q: 0.5, peak: 0.4 });
  playTone({ freq: 600, freqEnd: 150, type: "sine", duration: 0.3, attack: 0.01, decay: 0.05, sustain: 0.3, release: 0.15, peak: 0.25 });
}

export function playHatchChirp() {
  ensureContext();
  const base = 700 + Math.random() * 300;
  playTone({ freq: base, freqEnd: base * 1.3, type: "sine", duration: 0.12, attack: 0.005, decay: 0.02, sustain: 0.5, release: 0.05, peak: 0.22 });
  playTone({ freq: base * 1.3, freqEnd: base, type: "sine", start: 0.13, duration: 0.1, attack: 0.005, decay: 0.02, sustain: 0.5, release: 0.05, peak: 0.18 });
}

// --- background music: lookahead scheduler ---

const SCHEDULE_INTERVAL_MS = 25;
const LOOKAHEAD = 0.1;
const NOTE_DURATION = 0.45;

const MELODIES = [
  [523.25, 587.33, 659.25, 587.33, 523.25, 659.25, 783.99, 659.25],
  [587.33, 659.25, 783.99, 659.25, 587.33, 523.25, 587.33, 659.25],
  [523.25, 659.25, 587.33, 783.99, 659.25, 523.25, 587.33, 523.25],
];

let musicTimer = null;
let musicPlaying = false;
let melody = MELODIES[0];
let stepIndex = 0;
let nextNoteTime = 0;

function scheduleMusicStep() {
  while (nextNoteTime < ctx.currentTime + LOOKAHEAD) {
    const freq = melody[stepIndex % melody.length];
    const relStart = nextNoteTime - ctx.currentTime;
    playTone({
      freq,
      type: "sine",
      start: relStart,
      duration: NOTE_DURATION * 0.9,
      attack: 0.03,
      decay: 0.1,
      sustain: 0.4,
      release: 0.25,
      peak: 0.18,
      destination: musicGain,
    });
    if (stepIndex % 4 === 0) {
      playTone({
        freq: freq / 2,
        type: "sine",
        start: relStart,
        duration: NOTE_DURATION * 1.8,
        attack: 0.1,
        decay: 0.2,
        sustain: 0.3,
        release: 0.5,
        peak: 0.1,
        destination: musicGain,
      });
    }
    stepIndex++;
    nextNoteTime += NOTE_DURATION;
    if (stepIndex % melody.length === 0) {
      melody = MELODIES[Math.floor(Math.random() * MELODIES.length)];
    }
  }
}

export function startMusic() {
  ensureContext();
  if (musicPlaying) return;
  musicPlaying = true;
  stepIndex = 0;
  nextNoteTime = ctx.currentTime + 0.1;
  musicTimer = setInterval(scheduleMusicStep, SCHEDULE_INTERVAL_MS);
}

export function stopMusic() {
  musicPlaying = false;
  clearInterval(musicTimer);
  musicTimer = null;
}
