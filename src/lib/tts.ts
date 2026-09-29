let audioCtx: AudioContext | null = null;
let koreanVoice: SpeechSynthesisVoice | null = null;
let voiceCheckDone = false;
let voiceCheckPromise: Promise<void> | null = null;

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

function findKoreanVoice(): SpeechSynthesisVoice | null {
  if (!window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  return voices.find((v) => v.lang.startsWith('ko')) || null;
}

function ensureVoiceCheck(): Promise<void> {
  if (voiceCheckDone) return Promise.resolve();
  if (voiceCheckPromise) return voiceCheckPromise;

  const found = findKoreanVoice();
  if (found) {
    koreanVoice = found;
    voiceCheckDone = true;
    return Promise.resolve();
  }

  if (window.speechSynthesis && window.speechSynthesis.getVoices().length > 0) {
    voiceCheckDone = true;
    return Promise.resolve();
  }

  voiceCheckPromise = new Promise<void>((resolve) => {
    if (!window.speechSynthesis) {
      voiceCheckDone = true;
      resolve();
      return;
    }

    const finish = () => {
      koreanVoice = findKoreanVoice();
      voiceCheckDone = true;
      resolve();
    };

    window.speechSynthesis.addEventListener('voiceschanged', finish, { once: true });
    setTimeout(() => {
      if (!voiceCheckDone) finish();
    }, 1500);
  });

  return voiceCheckPromise;
}

function speakWithBrowser(text: string, voice: SpeechSynthesisVoice, rate: number): Promise<boolean> {
  return new Promise((resolve) => {
    if (!window.speechSynthesis) { resolve(false); return; }

    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ko-KR';
    u.voice = voice;
    u.rate = rate;

    let done = false;
    const startTime = Date.now();

    u.onend = () => {
      if (done) return;
      done = true;
      resolve(Date.now() - startTime > 150);
    };
    u.onerror = () => {
      if (done) return;
      done = true;
      resolve(false);
    };

    try {
      window.speechSynthesis.speak(u);
    } catch {
      done = true;
      resolve(false);
      return;
    }

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
    if (arrayBuffer.byteLength < 100) return false;

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

  await ensureVoiceCheck();

  if (koreanVoice) {
    const ok = await speakWithBrowser(text, koreanVoice, rate);
    if (ok) return true;
  }

  return speakWithApi(text);
}

export function isTtsAvailable(): boolean | null {
  return true;
}

export function initTts(): void {
  if (typeof window === 'undefined') return;
  ensureVoiceCheck();
}
