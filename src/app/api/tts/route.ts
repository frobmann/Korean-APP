export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const text = searchParams.get('text');
  if (!text || text.length > 200) {
    return new Response('Missing or too long text', { status: 400 });
  }

  const speed = searchParams.get('speed') || '0.5';
  const encoded = encodeURIComponent(text);
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=ko&client=tw-ob&q=${encoded}&ttsspeed=${speed}`;

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      'Referer': 'https://translate.google.com/',
    },
  });

  if (!res.ok) {
    return new Response('TTS fetch failed', { status: 502 });
  }

  const audio = await res.arrayBuffer();
  return new Response(audio, {
    headers: {
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
