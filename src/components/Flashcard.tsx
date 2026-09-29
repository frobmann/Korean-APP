'use client';

import { useState, useCallback, useEffect } from 'react';
import Avatar from './Avatar';
import CategorySelect from './CategorySelect';
import { VocabCard, getCardsByCategory, getCategories } from '@/lib/vocabulary';
import { speakKorean, unlockAudio } from '@/lib/tts';

interface FlashcardProps {
  onScore: (n: number) => void;
}

export default function Flashcard({ onScore }: FlashcardProps) {
  const [category, setCategory] = useState('Alle');
  const [card, setCard] = useState<VocabCard | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [expression, setExpression] = useState<'normal' | 'happy' | 'speaking' | 'listening'>('normal');
  const categories = getCategories();

  const nextCard = useCallback(
    (cat?: string) => {
      const useCat = cat ?? category;
      const cards = getCardsByCategory(useCat);
      if (!cards.length) return;
      const idx = Math.floor(Math.random() * cards.length);
      setCard(cards[idx]);
      setFlipped(false);
      setExpression('normal');
    },
    [category],
  );

  useEffect(() => {
    nextCard();
  }, []);

  function handleFlip() {
    if (!flipped) {
      setFlipped(true);
      setExpression('happy');
      onScore(5);
    }
  }

  function handleCategoryChange(cat: string) {
    setCategory(cat);
    nextCard(cat);
  }

  if (!card) return null;

  return (
    <div>
      <CategorySelect
        categories={categories}
        value={category}
        onChange={handleCategoryChange}
      />

      <div className="flex justify-center py-2">
        <Avatar expression={expression} />
      </div>

      <div
        className="flip-card"
        onClick={handleFlip}
        style={{ cursor: 'pointer' }}
      >
        <div className={`flip-card-inner ${flipped ? 'flipped' : ''}`}>
          <div className="flip-card-front bubble">
            <span className="korean-big">{card.korean}</span>
            <span className="block text-sm text-text-muted mt-2">Tippe zum Umdrehen</span>
          </div>
          <div className="flip-card-back bubble">
            <span className="korean-big">{card.korean}</span>
            <span className="roman">[ {card.romanization} ]</span>
            <span className="english text-lg" style={{ marginTop: '8px', display: 'block' }}>{card.english}</span>
            {card.notes && (
              <span className="block text-xs text-text-muted my-0.5">{card.notes}</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-center my-3">
        <button
          className="play-btn"
          onClick={(e) => {
            e.stopPropagation();
            unlockAudio();
            setExpression('speaking');
            speakKorean(card.korean).then(() => setExpression('normal'));
          }}
        >
          🔊 Anhören
        </button>
      </div>

      <div className="flex justify-center mt-2">
        <button className="next-btn" onClick={() => nextCard()}>
          Nächstes Wort →
        </button>
      </div>
    </div>
  );
}
