'use client';

import { VocabCard } from './vocabulary';

const STORAGE_KEY = 'kt-user-vocab';

export function getUserCards(): VocabCard[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveUserCards(cards: VocabCard[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
  } catch {}
}

export function addUserCards(newCards: VocabCard[]): VocabCard[] {
  const existing = getUserCards();
  const existingKorean = new Set(existing.map((c) => c.korean));
  const toAdd = newCards.filter((c) => !existingKorean.has(c.korean));
  const updated = [...existing, ...toAdd];
  saveUserCards(updated);
  return updated;
}

export function removeUserCard(korean: string): void {
  const cards = getUserCards().filter((c) => c.korean !== korean);
  saveUserCards(cards);
}
