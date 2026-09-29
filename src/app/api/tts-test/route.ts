export const dynamic = 'force-dynamic';

export async function GET() {
  const text = '안녕하세요';
  const results: Record<string, string> = {};

  // Test Edge TTS
  try {
    const { MsEdgeTTS, OUTPUT_FORMAT } = await import('msedge-tts');
    const tts = new MsEdgeTTS();
    await tts.setMetadata('ko-KR-SunHiNeural', OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
    const { audioStream } = tts.toStream(text);
    const chunks: Buffer[] = [];
    for await (const chunk of audioStream) {
      chunks.push(Buffer.from(chunk));
    }
    const buf = Buffer.concat(chunks);
    results.edge_tts = `OK (${buf.length} bytes)`;
    tts.close();
  } catch (e) {
    results.edge_tts = `FAIL: ${e instanceof Error ? e.message : String(e)}`;
  }

  // Test Google TTS (gtx)
  try {
    const encoded = encodeURIComponent(text);
    const res = await fetch(
      `https://translate.googleapis.com/translate_tts?ie=UTF-8&tl=ko&client=gtx&q=${encoded}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          Referer: 'https://translate.google.com/',
        },
        signal: AbortSignal.timeout(5000),
      },
    );
    if (res.ok) {
      const buf = await res.arrayBuffer();
      results.google_gtx = `OK (${buf.byteLength} bytes)`;
    } else {
      results.google_gtx = `FAIL: HTTP ${res.status}`;
    }
  } catch (e) {
    results.google_gtx = `FAIL: ${e instanceof Error ? e.message : String(e)}`;
  }

  // Test Google TTS (tw-ob)
  try {
    const encoded = encodeURIComponent(text);
    const res = await fetch(
      `https://translate.google.com/translate_tts?ie=UTF-8&tl=ko&client=tw-ob&q=${encoded}&ttsspeed=0.5`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0',
          Referer: 'https://translate.google.com/',
        },
        signal: AbortSignal.timeout(5000),
      },
    );
    if (res.ok) {
      const buf = await res.arrayBuffer();
      results.google_twob = `OK (${buf.byteLength} bytes)`;
    } else {
      results.google_twob = `FAIL: HTTP ${res.status}`;
    }
  } catch (e) {
    results.google_twob = `FAIL: ${e instanceof Error ? e.message : String(e)}`;
  }

  return new Response(JSON.stringify(results, null, 2), {
    headers: { 'Content-Type': 'application/json' },
  });
}
