let audioCtx: AudioContext | null = null;
let hasKoreanVoice = false;
let voicesChecked = false;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new Ctor();
  }
  return audioCtx;
}

export function unlockAudio(): void {
  if (typeof window === 'undefined') return;
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
}

function checkVoices(): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) {
    voicesChecked = true;
    hasKoreanVoice = voices.some((v) => v.lang.startsWith('ko'));
  }
}

function speakWithBrowser(text: string, rate: number): Promise<boolean> {
  return new Promise((resolve) => {
    if (!window.speechSynthesis) { resolve(false); return; }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ko-KR';
    u.rate = rate;
    const voices = window.speechSynthesis.getVoices();
    const koVoice = voices.find((v) => v.lang.startsWith('ko'));
    if (koVoice) u.voice = koVoice;

    let done = false;
    u.onend = () => { if (!done) { done = true; resolve(true); } };
    u.onerror = () => { if (!done) { done = true; resolve(false); } };
    try {
      window.speechSynthesis.speak(u);
    } catch {
      resolve(false);
      return;
    }
    setTimeout(() => { if (!done) { done = true; window.speechSynthesis.cancel(); resolve(false); } }, 8000);
  });
}

async function speakWithApi(text: string): Promise<boolean> {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') await ctx.resume();

    const encoded = encodeURIComponent(text);
    const res = await fetch(`/api/tts?text=${encoded}`);
    if (!res.ok) return false;

    const arrayBuffer = await res.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    source.start(0);

    return new Promise((resolve) => {
      source.onended = () => resolve(true);
      setTimeout(() => resolve(true), (audioBuffer.duration + 1) * 1000);
    });
  } catch {
    return false;
  }
}

export async function speakKorean(text: string, rate = 0.6): Promise<boolean> {
  if (!text) return false;

  if (!voicesChecked) checkVoices();

  if (hasKoreanVoice) {
    const ok = await speakWithBrowser(text, rate);
    if (ok) return true;
  }

  return speakWithApi(text);
}

export function isTtsAvailable(): boolean | null {
  return true;
}

export function initTts(): void {
  if (typeof window === 'undefined') return;

  checkVoices();

  if (window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = () => checkVoices();
  }
}
