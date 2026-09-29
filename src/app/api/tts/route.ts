export const dynamic = 'force-dynamic';
export const maxDuration = 10;

import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

let ttsInstance: MsEdgeTTS | null = null;
let ttsReady = false;

async function getTts(): Promise<MsEdgeTTS> {
  if (ttsInstance && ttsReady) return ttsInstance;
  const tts = new MsEdgeTTS();
  await tts.setMetadata(
    'ko-KR-SunHiNeural',
    OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3,
  );
  ttsInstance = tts;
  ttsReady = true;
  return tts;
}

async function synthesizeEdge(text: string): Promise<ArrayBuffer | null> {
  try {
    const tts = await getTts();
    const { audioStream } = tts.toStream(text, { rate: '-20%' });
    const chunks: Buffer[] = [];
    for await (const chunk of audioStream) {
      chunks.push(Buffer.from(chunk));
    }
    const buf = Buffer.concat(chunks);
    if (buf.length < 100) return null;
    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  } catch {
    ttsInstance = null;
    ttsReady = false;
    return null;
  }
}

async function synthesizeGoogle(text: string): Promise<ArrayBuffer | null> {
  try {
    const encoded = encodeURIComponent(text);
    const urls = [
      `https://translate.googleapis.com/translate_tts?ie=UTF-8&tl=ko&client=gtx&q=${encoded}`,
      `https://translate.google.com/translate_tts?ie=UTF-8&tl=ko&client=tw-ob&q=${encoded}&ttsspeed=0.5`,
    ];
    for (const url of urls) {
      try {
        const res = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            Referer: 'https://translate.google.com/',
          },
          signal: AbortSignal.timeout(5000),
        });
        if (res.ok) {
          const buf = await res.arrayBuffer();
          if (buf.byteLength > 100) return buf;
        }
      } catch {
        continue;
      }
    }
    return null;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const text = searchParams.get('text');
  if (!text || text.length > 200) {
    return new Response('Missing or too long text', { status: 400 });
  }

  // Try Edge TTS first (most reliable), then Google as fallback
  let audio = await synthesizeEdge(text);
  if (!audio) {
    audio = await synthesizeGoogle(text);
  }

  if (!audio) {
    return new Response('TTS synthesis failed', { status: 502 });
  }

  return new Response(audio, {
    headers: {
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
