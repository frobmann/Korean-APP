'use client';

import { useState, useRef } from 'react';
import { VocabCard } from '@/lib/vocabulary';
import { addUserCards, getUserCards, removeUserCard } from '@/lib/user-vocab';

interface ScanResult {
  korean: string;
  romanization: string;
  english: string;
  category: string;
  notes?: string;
}

export default function Scanner({ onCardsAdded }: { onCardsAdded: () => void }) {
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState<ScanResult[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [userCards, setUserCardsState] = useState<VocabCard[]>(() => {
    if (typeof window === 'undefined') return [];
    return getUserCards();
  });
  const [showMyCards, setShowMyCards] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setScanning(true);
    setResults([]);
    setSelected(new Set());
    setSaved(false);
    setError('');

    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64 }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data.cards && data.cards.length > 0) {
        setResults(data.cards);
        setSelected(new Set(data.cards.map((_: ScanResult, i: number) => i)));
      } else {
        setError('Kein koreanischer Text erkannt. Versuch ein anderes Foto.');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Scannen');
    }
    setScanning(false);
  }

  function toggleCard(idx: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }

  function saveCards() {
    const cards: VocabCard[] = results
      .filter((_, i) => selected.has(i))
      .map((r, i) => ({
        id: `user_${Date.now()}_${i}`,
        korean: r.korean,
        romanization: r.romanization,
        english: r.english,
        category: r.category,
        notes: r.notes || '',
      }));

    addUserCards(cards);
    setUserCardsState(getUserCards());
    setSaved(true);
    onCardsAdded();
  }

  function handleRemove(korean: string) {
    removeUserCard(korean);
    const updated = getUserCards();
    setUserCardsState(updated);
    onCardsAdded();
  }

  return (
    <div>
      <div className="flex flex-col items-center gap-3 mb-4">
        <p className="text-sm text-text-muted text-center">
          Fotografiere koreanischen Text (Lehrbuch, Notizen, Schilder) und füge die Wörter als Karteikarten hinzu.
        </p>

        <div className="flex gap-2">
          <button
            className="scan-btn"
            onClick={() => fileRef.current?.click()}
            disabled={scanning}
          >
            {scanning ? '⏳ Wird erkannt...' : '📷 Foto aufnehmen'}
          </button>
          <button
            className={`scan-btn-secondary ${showMyCards ? 'active' : ''}`}
            onClick={() => setShowMyCards(!showMyCards)}
          >
            📋 Meine Karten ({userCards.length})
          </button>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = '';
          }}
        />
      </div>

      {error && (
        <div className="scan-error">{error}</div>
      )}

      {scanning && (
        <div className="flex flex-col items-center gap-2 py-8">
          <div className="thinking"><span /><span /><span /></div>
          <span className="text-sm text-text-muted">Claude analysiert das Bild...</span>
        </div>
      )}

      {results.length > 0 && !saved && (
        <div className="scan-results">
          <h3 className="text-sm font-bold mb-2">
            {results.length} Wörter erkannt — wähle aus:
          </h3>
          {results.map((r, i) => (
            <label key={i} className={`scan-card ${selected.has(i) ? 'selected' : ''}`}>
              <input
                type="checkbox"
                checked={selected.has(i)}
                onChange={() => toggleCard(i)}
              />
              <div className="scan-card-content">
                <span className="scan-korean">{r.korean}</span>
                <span className="scan-rom">({r.romanization})</span>
                <span className="scan-meaning">{r.english}</span>
                <span className="scan-cat">{r.category}</span>
              </div>
            </label>
          ))}
          <button
            className="save-btn"
            onClick={saveCards}
            disabled={selected.size === 0}
          >
            ✅ {selected.size} Karten hinzufügen
          </button>
        </div>
      )}

      {saved && (
        <div className="scan-success">
          ✅ {selected.size} Karten wurden hinzugefügt! Du findest sie jetzt in den Flashcards.
        </div>
      )}

      {showMyCards && (
        <div className="my-cards">
          <h3 className="text-sm font-bold mb-2">Meine gescannten Karten</h3>
          {userCards.length === 0 ? (
            <p className="text-sm text-text-muted">Noch keine Karten gescannt.</p>
          ) : (
            userCards.map((c) => (
              <div key={c.id} className="my-card">
                <div className="my-card-text">
                  <span className="scan-korean">{c.korean}</span>
                  <span className="scan-rom">({c.romanization})</span>
                  <span className="scan-meaning">{c.english}</span>
                </div>
                <button
                  className="my-card-del"
                  onClick={() => handleRemove(c.korean)}
                  title="Entfernen"
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
