let hasKoreanVoice: boolean | null = null;
let audioEl: HTMLAudioElement | null = null;

function getAudio(): HTMLAudioElement {
  if (!audioEl) {
    audioEl = new Audio();
    audioEl.setAttribute('playsinline', '');
  }
  return audioEl;
}

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

async function speakWithApi(text: string): Promise<boolean> {
  try {
    const encoded = encodeURIComponent(text);
    const res = await fetch(`/api/tts?text=${encoded}`);
    if (!res.ok) return false;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const audio = getAudio();
    audio.src = url;

    return new Promise((resolve) => {
      audio.onended = () => { URL.revokeObjectURL(url); resolve(true); };
      audio.onerror = () => { URL.revokeObjectURL(url); resolve(false); };
      audio.play().catch(() => { URL.revokeObjectURL(url); resolve(false); });
    });
  } catch {
    return false;
  }
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

  getAudio();

  document.addEventListener('touchstart', function unlock() {
    const audio = getAudio();
    audio.src = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYYoRwmHAAAAAAD/+1DEAAAH+ANoUAAAIv8yblTBEACqqq7u7u7u7v/EREd3d3f/iIju7u7u////xERHd3d3//iI7u7u7u7///8REd3d3d3//+Iju7u7v////ERERERERERERERERERERER//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////+1DEUgPAAADSAAAAAAAANIAAAAT//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////8=';
    audio.play().then(() => { audio.pause(); audio.currentTime = 0; }).catch(() => {});
    document.removeEventListener('touchstart', unlock);
  }, { once: true });

  if (window.speechSynthesis) {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => {
      hasKoreanVoice = checkKoreanVoice();
    };
  }
}
