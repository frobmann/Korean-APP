let ttsAvailable: boolean | null = null;

export function speakKorean(text: string, rate = 0.6): Promise<boolean> {
  return new Promise((resolve) => {
    if (!text || !window.speechSynthesis) {
      resolve(false);
      return;
    }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ko-KR';
    u.rate = rate;
    const voices = window.speechSynthesis.getVoices();
    const koVoice = voices.find((v) => v.lang.startsWith('ko'));
    if (koVoice) u.voice = koVoice;

    let ended = false;
    u.onend = () => {
      ended = true;
      ttsAvailable = true;
      resolve(true);
    };
    u.onerror = () => {
      ended = true;
      resolve(false);
    };
    try {
      window.speechSynthesis.speak(u);
    } catch {
      resolve(false);
      return;
    }
    setTimeout(() => {
      if (!ended) resolve(false);
    }, 6000);
  });
}

export function isTtsAvailable(): boolean | null {
  return ttsAvailable;
}

export function initTts(): void {
  if (typeof window === 'undefined') return;
  if (window.speechSynthesis) {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.getVoices();
    };
  }
}
