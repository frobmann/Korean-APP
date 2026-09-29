'use client';

import { useState, useCallback, useEffect } from 'react';
import Avatar from './Avatar';
import { VocabCard, getCardsByCategory, getRandomCards, getCategories } from '@/lib/vocabulary';
import { speakKorean } from '@/lib/tts';

function escHtml(s: string) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

function renderSyllables(korean: string, romanization: string): string {
  const chars = korean.replace(/\s/g, '').split('');
  if (chars.length <= 1) return '';
  const romParts = romanization.split(/[-\s]+/);
  let html = '<div class="syllable-box">';
  for (let i = 0; i < chars.length; i++) {
    html += `<div class="syllable"><div class="char">${escHtml(chars[i])}</div>`;
    if (romParts[i]) html += `<div class="rom">${escHtml(romParts[i])}</div>`;
    html += '</div>';
  }
  html += '</div>';
  return html;
}

interface FlashcardProps {
  onScore: (n: number) => void;
}

export default function Flashcard({ onScore }: FlashcardProps) {
  const [category, setCategory] = useState('Alle');
  const [card, setCard] = useState<VocabCard | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [answered, setAnswered] = useState<string | null>(null);
  const [expression, setExpression] = useState<'normal' | 'happy' | 'speaking' | 'listening'>('normal');
  const categories = getCategories();

  const nextCard = useCallback(
    (cat?: string) => {
      const useCat = cat ?? category;
      const cards = getCardsByCategory(useCat);
      if (!cards.length) return;
      const idx = Math.floor(Math.random() * cards.length);
      const c = cards[idx];
      const wrong = getRandomCards(3, c.english).map((x) => x.english);
      const opts = [c.english, ...wrong].sort(() => Math.random() - 0.5);
      setCard(c);
      setOptions(opts);
      setAnswered(null);
      setExpression('normal');
    },
    [category],
  );

  useEffect(() => {
    nextCard();
  }, []);

  function handleAnswer(opt: string) {
    if (answered) return;
    setAnswered(opt);
    if (card && opt === card.english) {
      setExpression('happy');
      onScore(10);
      setTimeout(() => nextCard(), 1800);
    } else {
      setExpression('normal');
      setTimeout(() => nextCard(), 2500);
    }
  }

  function handleCategoryChange(cat: string) {
    setCategory(cat);
    nextCard(cat);
  }

  if (!card) return null;

  const syllablesHtml = renderSyllables(card.korean, card.romanization);

  return (
    <div>
      {/* Category filter */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {categories.map((cat) => (
          <button
            key={cat}
            className={`cat-chip ${category === cat ? 'active' : ''}`}
            onClick={() => handleCategoryChange(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Avatar */}
      <div className="flex justify-center py-2">
        <Avatar expression={expression} />
      </div>

      {/* Word bubble */}
      <div className="bubble">
        <span className="korean-big">{card.korean}</span>
        {syllablesHtml && (
          <div dangerouslySetInnerHTML={{ __html: syllablesHtml }} />
        )}
        <span className="roman">[ {card.romanization} ]</span>
        {card.notes && (
          <span className="block text-xs text-text-muted my-0.5">{card.notes}</span>
        )}
        <span className="block text-sm text-text-mid">Was bedeutet dieses Wort?</span>
      </div>

      {/* Play button */}
      <div className="flex justify-center my-2">
        <button
          className="play-btn"
          onClick={() => {
            setExpression('speaking');
            speakKorean(card.korean).then(() => setExpression('normal'));
          }}
        >
          🔊 Anhören
        </button>
      </div>

      {/* Choices */}
      <div className="choices">
        {options.map((opt) => {
          let cls = 'choice-btn';
          if (answered) {
            if (opt === card.english) cls += ' correct';
            else if (opt === answered) cls += ' wrong';
          }
          return (
            <button
              key={opt}
              className={cls}
              onClick={() => handleAnswer(opt)}
              disabled={!!answered}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {answered && (
        <div className="flex justify-center mt-4">
          <button className="next-btn" onClick={() => nextCard()}>
            Nächstes Wort →
          </button>
        </div>
      )}
    </div>
  );
}
