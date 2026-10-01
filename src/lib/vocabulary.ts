import vocabData from '@/data/vocabulary.json';

export interface VocabCard {
  id: string;
  korean: string;
  romanization: string;
  english: string;
  category: string;
  notes?: string;
}

export const allCards: VocabCard[] = vocabData as VocabCard[];

let userCards: VocabCard[] = [];

export function setUserCards(cards: VocabCard[]): void {
  userCards = cards;
}

function getAllCards(): VocabCard[] {
  return [...allCards, ...userCards];
}

export function getCategories(): string[] {
  const seen = new Set<string>();
  getAllCards().forEach((c) => seen.add(c.category));
  return ['Alle', ...Array.from(seen)];
}

export function getCardsByCategory(category: string): VocabCard[] {
  const all = getAllCards();
  if (category === 'Alle') return all;
  return all.filter((c) => c.category === category);
}

export function getRandomCards(count: number, exclude?: string): VocabCard[] {
  const all = getAllCards();
  const pool = exclude ? all.filter((c) => c.english !== exclude) : [...all];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}
