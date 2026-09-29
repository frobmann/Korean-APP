'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { initTts } from '@/lib/tts';

const Flashcard = dynamic(() => import('@/components/Flashcard'), { ssr: false });
const Speaking = dynamic(() => import('@/components/Speaking'), { ssr: false });
const Chat = dynamic(() => import('@/components/Chat'), { ssr: false });

type Section = 'listen' | 'speak' | 'repeat' | 'chat';

export default function Home() {
  const [section, setSection] = useState<Section>('listen');
  const [score, setScore] = useState(0);

  useEffect(() => {
    initTts();
    try {
      const s = localStorage.getItem('kt-score');
      if (s) setScore(parseInt(s) || 0);
    } catch {}
  }, []);

  function addScore(n: number) {
    setScore((prev) => {
      const next = prev + n;
      try { localStorage.setItem('kt-score', String(next)); } catch {}
      return next;
    });
  }

  return (
    <>
      <div className="topbar">
        <h1>🎓 <span>한국어</span> 선생님</h1>
        <div className="score-pill">⭐ {score}</div>
      </div>

      <nav className="bnav">
        {(['listen', 'speak', 'repeat', 'chat'] as Section[]).map((s) => {
          const info = {
            listen: { ico: '👂', label: '듣기' },
            speak: { ico: '🎤', label: '말하기' },
            repeat: { ico: '🔁', label: '따라하기' },
            chat: { ico: '💬', label: '대화' },
          }[s];
          return (
            <button
              key={s}
              className={section === s ? 'active' : ''}
              onClick={() => setSection(s)}
            >
              <span className="ico">{info.ico}</span>
              {info.label}
            </button>
          );
        })}
      </nav>

      <div style={{ display: section === 'listen' ? 'block' : 'none' }}>
        <Flashcard onScore={addScore} />
      </div>
      <div style={{ display: section === 'speak' ? 'block' : 'none' }}>
        <Speaking mode="speak" onScore={addScore} />
      </div>
      <div style={{ display: section === 'repeat' ? 'block' : 'none' }}>
        <Speaking mode="repeat" onScore={addScore} />
      </div>
      <div style={{ display: section === 'chat' ? 'flex' : 'none', flexDirection: 'column' as const, height: 'calc(100vh - 120px)' }}>
        <Chat />
      </div>
    </>
  );
}
