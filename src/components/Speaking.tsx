'use client';

import { useState, useCallback, useEffect } from 'react';
import Avatar from './Avatar';
import { VocabCard, getCardsByCategory, getCategories } from '@/lib/vocabulary';
import { speakKorean } from '@/lib/tts';

function similarity(a: string, b: string): number {
  if (a === b) return 3;
  if (a.includes(b) || b.includes(a)) return 2;
  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;
  if (longer.length === 0) return 0;
  const costs: number[] = [];
  for (let i = 0; i <= longer.length; i++) {
    let lastVal = i;
    for (let j = 0; j <= shorter.length; j++) {
      if (i === 0) costs[j] = j;
      else if (j > 0) {
        let newVal = costs[j - 1];
        if (longer.charAt(i - 1) !== shorter.charAt(j - 1))
          newVal = Math.min(newVal, lastVal, costs[j]) + 1;
        costs[j - 1] = lastVal;
        lastVal = newVal;
      }
    }
    if (i > 0) costs[shorter.length] = lastVal;
  }
  const dist = costs[shorter.length];
  const ratio = (longer.length - dist) / longer.length;
  if (ratio > 0.8) return 2;
  if (ratio > 0.5) return 1;
  return 0;
}

interface SpeakingProps {
  mode: 'speak' | 'repeat';
  onScore: (n: number) => void;
}

export default function Speaking({ mode, onScore }: SpeakingProps) {
  const [category, setCategory] = useState('Alle');
  const [card, setCard] = useState<VocabCard | null>(null);
  const [expression, setExpression] = useState<'normal' | 'happy' | 'speaking' | 'listening'>('normal');
  const [recording, setRecording] = useState(false);
  const [result, setResult] = useState<{ spoken: string; score: number } | null>(null);
  const [showHint, setShowHint] = useState(false);
  const categories = getCategories();
  const hasSR = typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  const nextCard = useCallback(
    (cat?: string) => {
      const useCat = cat ?? category;
      const cards = getCardsByCategory(useCat);
      if (!cards.length) return;
      const idx = Math.floor(Math.random() * cards.length);
      setCard(cards[idx]);
      setResult(null);
      setShowHint(false);
      setExpression('normal');
    },
    [category],
  );

  useEffect(() => {
    nextCard();
  }, []);

  function startRecognition() {
    if (!card) return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = 'ko-KR';
    rec.continuous = false;
    rec.interimResults = false;
    rec.maxAlternatives = 5;
    setRecording(true);
    setExpression('listening');

    rec.onresult = (ev: SpeechRecognitionEvent) => {
      setRecording(false);
      const results = ev.results[0];
      let best = '';
      let bestScore = 0;
      for (let i = 0; i < results.length; i++) {
        const t = results[i].transcript.replace(/\s/g, '');
        const expected = card.korean.replace(/\s/g, '');
        if (t === expected) { best = t; bestScore = 3; break; }
        const s = similarity(t, expected);
        if (s > bestScore) { bestScore = s; best = t; }
      }
      setResult({ spoken: best || results[0].transcript, score: bestScore });
      if (bestScore >= 3) {
        setExpression('happy');
        onScore(15);
      } else if (bestScore >= 2) {
        setExpression('happy');
        onScore(10);
      } else if (bestScore >= 1) {
        setExpression('normal');
        onScore(3);
      } else {
        setExpression('normal');
      }
    };
    rec.onerror = () => {
      setRecording(false);
      setExpression('normal');
    };
    rec.onend = () => setRecording(false);
    rec.start();
  }

  if (!card) return null;

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {categories.map((cat) => (
          <button
            key={cat}
            className={`cat-chip ${category === cat ? 'active' : ''}`}
            onClick={() => { setCategory(cat); nextCard(cat); }}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="flex justify-center py-2">
        <Avatar expression={expression} />
      </div>

      <div className="bubble">
        {mode === 'speak' ? (
          <>
            <span className="english text-lg">{card.english}</span>
            <br />
            <span className="block text-sm text-text-muted mt-1">Sag es auf Koreanisch!</span>
          </>
        ) : (
          <>
            <span className="korean-big">{card.korean}</span>
            <span className="roman">[ {card.romanization} ]</span>
            <span className="english">{card.english}</span>
          </>
        )}
      </div>

      {mode === 'repeat' && (
        <div className="flex justify-center my-2">
          <button
            className="play-btn"
            onClick={() => {
              setExpression('speaking');
              speakKorean(card.korean).then(() => setExpression('normal'));
            }}
          >
            🔊 Aussprache anhören
          </button>
        </div>
      )}

      <div className="flex flex-col items-center gap-2 mt-4">
        {hasSR ? (
          <>
            <button
              className={`mic-btn ${recording ? 'recording' : ''}`}
              onClick={startRecognition}
              disabled={recording}
            >
              🎤
            </button>
            <span className="text-xs font-semibold text-text-muted">
              {recording ? 'Ich höre zu...' : 'Tippe zum Sprechen'}
            </span>
          </>
        ) : (
          <div className="notice">
            Spracherkennung nicht verfügbar. Bitte Chrome oder Edge verwenden.
          </div>
        )}

        {mode === 'speak' && !showHint && !result && (
          <button
            className="text-xs text-text-muted underline cursor-pointer border-0 bg-transparent"
            onClick={() => setShowHint(true)}
          >
            💡 Hinweis zeigen
          </button>
        )}
        {mode === 'speak' && showHint && (
          <div className="text-sm text-text-muted text-center">
            Hinweis: <span className="font-bold text-text font-serif text-base">{card.korean}</span>{' '}
            <span className="text-text-muted">({card.romanization})</span>
          </div>
        )}
      </div>

      {result && (
        <div className="mt-4 flex flex-col items-center gap-2">
          <div className={`result ${result.score >= 3 ? 'perfect' : result.score >= 2 ? 'good' : result.score >= 1 ? 'close' : 'wrong'}`}>
            {result.score >= 3 ? (
              <>
                <span className="big">🌟 완벽해요!</span>
                <span className="detail">Perfekte Aussprache!</span>
              </>
            ) : result.score >= 2 ? (
              <>
                <span className="big">👏 잘했어요!</span>
                <div className="result-compare">
                  <div className="col"><div className="col-label">Du</div><div className="col-val">{result.spoken}</div></div>
                  <div className="col" style={{ alignSelf: 'center', fontSize: '1.2rem', opacity: 0.5 }}>→</div>
                  <div className="col"><div className="col-label">Richtig</div><div className="col-val">{card.korean}</div></div>
                </div>
                <span className="detail">Gut gemacht!</span>
              </>
            ) : result.score >= 1 ? (
              <>
                <span className="big">🤔 거의!</span>
                <div className="result-compare">
                  <div className="col"><div className="col-label">Du</div><div className="col-val">{result.spoken}</div></div>
                  <div className="col" style={{ alignSelf: 'center', fontSize: '1.2rem', opacity: 0.5 }}>→</div>
                  <div className="col"><div className="col-label">Richtig</div><div className="col-val">{card.korean}</div></div>
                </div>
                <span className="detail">Fast richtig!</span>
              </>
            ) : (
              <>
                <span className="big">다시! 💪</span>
                <div className="result-compare">
                  <div className="col"><div className="col-label">Du</div><div className="col-val">{result.spoken}</div></div>
                  <div className="col" style={{ alignSelf: 'center', fontSize: '1.2rem', opacity: 0.5 }}>→</div>
                  <div className="col"><div className="col-label">Richtig</div><div className="col-val">{card.korean}</div></div>
                </div>
                <span className="detail">Versuch es nochmal!</span>
              </>
            )}
          </div>
          <div className="pron-guide">
            <strong>{card.korean}</strong> = <strong>{card.romanization}</strong>
            {card.notes && <> · {card.notes}</>}
          </div>
          {result.score < 2 && (
            <button className="retry-btn" onClick={() => { setResult(null); setShowHint(false); }}>
              🔄 Nochmal versuchen
            </button>
          )}
          <button className="next-btn" onClick={() => nextCard()}>
            Nächstes Wort →
          </button>
        </div>
      )}
    </div>
  );
}
