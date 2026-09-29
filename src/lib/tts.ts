let audioCtx: AudioContext | null = null;

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
  // iOS Safari requires speechSynthesis to be "warmed up" during a user gesture
  if (window.speechSynthesis) {
    const warmup = new SpeechSynthesisUtterance('');
    warmup.volume = 0;
    warmup.lang = 'ko-KR';
    window.speechSynthesis.speak(warmup);
    window.speechSynthesis.cancel();
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
    u.onerror = (e) => {
      if (!done) {
        done = true;
        // "interrupted" and "canceled" are not real failures
        const err = e as SpeechSynthesisErrorEvent;
        resolve(err.error === 'interrupted' || err.error === 'canceled');
      }
    };
    try {
      window.speechSynthesis.speak(u);
    } catch {
      resolve(false);
      return;
    }
    // iOS sometimes fires neither onend nor onerror — timeout as safety net
    setTimeout(() => {
      if (!done) {
        done = true;
        window.speechSynthesis.cancel();
        resolve(false);
      }
    }, 8000);
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

  // Always try browser SpeechSynthesis first — iOS has Korean voices built in
  // even when getVoices() returns empty (voices load asynchronously on iOS)
  if (window.speechSynthesis) {
    const ok = await speakWithBrowser(text, rate);
    if (ok) return true;
  }

  return speakWithApi(text);
}

export function isTtsAvailable(): boolean | null {
  return true;
}

export function initTts(): void {}
