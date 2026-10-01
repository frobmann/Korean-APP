import Anthropic from '@anthropic-ai/sdk';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const anthropic = new Anthropic();

export async function POST(request: Request) {
  const { image } = await request.json();
  if (!image) {
    return new Response('Missing image', { status: 400 });
  }

  const base64Match = image.match(/^data:image\/(jpeg|png|gif|webp);base64,(.+)$/);
  if (!base64Match) {
    return new Response('Invalid image format', { status: 400 });
  }

  const mediaType = `image/${base64Match[1]}` as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
  const base64Data = base64Match[2];

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: base64Data },
            },
            {
              type: 'text',
              text: `Analysiere dieses Bild und extrahiere ALLE koreanischen Wörter/Sätze die du findest.

Für jedes Wort/jeden Satz erstelle einen Eintrag mit:
- korean: der koreanische Text
- romanization: die Romanisierung
- english: deutsche Übersetzung
- category: passende Kategorie (z.B. "Greetings", "Food", "Verbs", "Numbers", "Adjectives", "Places", "Family", "Grammatik", etc.)
- notes: optionale Aussprache-Hinweise auf Deutsch

Antworte NUR mit einem JSON-Array, ohne Markdown-Formatierung, ohne Erklärung. Beispiel:
[{"korean":"안녕하세요","romanization":"annyeonghaseyo","english":"Hallo","category":"Greetings","notes":""}]

Wenn kein koreanischer Text gefunden wird, antworte mit: []`,
            },
          ],
        },
      ],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '[]';

    let cards;
    try {
      const cleaned = text.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
      cards = JSON.parse(cleaned);
    } catch {
      return Response.json({ cards: [], raw: text });
    }

    return Response.json({ cards });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}
