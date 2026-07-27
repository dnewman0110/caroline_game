// Spoken instructions via the browser's built-in Web Speech API. This is the
// only offline-safe way to get spoken narration without bundling audio files
// or making a network call — we deliberately restrict to voices flagged
// localService so nothing ever phones out to a cloud TTS backend. There is
// no real "child's voice" available this way; we just pick the most
// female/youthful-sounding local voice and raise its pitch to approximate
// one. Quality and availability vary by device/OS.

let muted = false;
let selectedVoice = null;

function pickVoice() {
  if (!window.speechSynthesis) return;
  const localVoices = window.speechSynthesis.getVoices().filter((v) => v.localService);
  if (!localVoices.length) return;

  const byName = localVoices.find((v) =>
    /female|child|girl|samantha|victoria|zira|susan|karen|moira|tessa|fiona/i.test(v.name)
  );
  const byLang = localVoices.find((v) => /^en/i.test(v.lang));
  selectedVoice = byName || byLang || localVoices[0];
}

if (window.speechSynthesis) {
  pickVoice();
  window.speechSynthesis.onvoiceschanged = pickVoice;
}

export function setMuted(isMuted) {
  muted = isMuted;
  if (muted && window.speechSynthesis) window.speechSynthesis.cancel();
}

export function speak(text) {
  if (!text || muted || !window.speechSynthesis || !selectedVoice) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.voice = selectedVoice;
  utterance.pitch = 1.6;
  utterance.rate = 1.0;
  utterance.volume = 1;
  window.speechSynthesis.speak(utterance);
}
