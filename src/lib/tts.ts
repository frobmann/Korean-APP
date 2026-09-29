let hasKoreanVoice: boolean | null = null;

function checkKoreanVoice(): boolean {
  if (typeof window === 'undefined' || !window.speechSynthesis) return false;
  const voices = window.speechSynthesis.getVoices();
  return voices.some((v) => v.lang.startsWith('ko'));
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

    let ended = false;
    u.onend = () => { ended = true; resolve(true); };
    u.onerror = () => { ended = true; resolve(false); };
    try { window.speechSynthesis.speak(u); } catch { resolve(false); return; }
    setTimeout(() => { if (!ended) resolve(false); }, 6000);
  });
}

function speakWithApi(text: string): Promise<boolean> {
  return new Promise((resolve) => {
    const encoded = encodeURIComponent(text);
    const audio = new Audio(`/api/tts?text=${encoded}`);
    audio.onended = () => resolve(true);
    audio.onerror = () => resolve(false);
    audio.play().catch(() => resolve(false));
  });
}

export async function speakKorean(text: string, rate = 0.6): Promise<boolean> {
  if (!text) return false;

  if (hasKoreanVoice === null) {
    hasKoreanVoice = checkKoreanVoice();
  }

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
  if (window.speechSynthesis) {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => {
      hasKoreanVoice = checkKoreanVoice();
    };
  }
}
