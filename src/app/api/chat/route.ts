import Anthropic from '@anthropic-ai/sdk';
import { topicPrompts } from '@/lib/topic-prompts';
import { allCards } from '@/lib/vocabulary';

const anthropic = new Anthropic();

export async function POST(request: Request) {
  const { messages, topic } = await request.json();

  const topicInfo = topicPrompts[topic] || topicPrompts.free;
  const vocabSample = allCards
    .slice(0, 40)
    .map((c) => `${c.korean} (${c.romanization}) = ${c.english}`)
    .join(', ');

  const systemPrompt =
    'Du bist 민지 (Minji), eine freundliche koreanische Sprachlehrerin. ' +
    `Der Lernende übt gerade: ${topicInfo.systemPrompt}. ` +
    'REGELN: ' +
    '1) Antworte IMMER auf Koreanisch mit Romanisierung in Klammern und deutscher Übersetzung darunter. ' +
    '2) Halte deine Antworten kurz (1-3 Sätze auf Koreanisch). ' +
    '3) Verwende einfaches Koreanisch für Anfänger (해요 Höflichkeitsform). ' +
    '4) Korrigiere sanft wenn der Lernende Fehler macht. ' +
    '5) Stelle Folgefragen um das Gespräch fortzusetzen. ' +
    '6) Format: Koreanisch\n(Romanisierung)\nDeutsche Übersetzung\n\n[Eventuell Tipp oder Erklärung]. ' +
    '7) Bei Aussprache-Fragen: Erkläre Mundstellung und Zungenlage. Vergleiche mit deutschen Lauten. ' +
    'Markiere Aussprachetipps mit [TIPP: ...]. ' +
    `Einige Vokabeln die der Lernende kennt: ${vocabSample}`;

  const apiMessages = messages.map((m: { role: string; content: string }) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }));

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 512,
    system: systemPrompt,
    messages: apiMessages.slice(-10),
  });

  const text =
    response.content[0].type === 'text' ? response.content[0].text : '';

  return Response.json({ text });
}
