export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const D_ID_API = 'https://api.d-id.com';

const videoCache = new Map<string, { url: string; expires: number }>();

async function didFetch(path: string, options?: RequestInit) {
  const apiKey = process.env.D_ID_API_KEY;
  if (!apiKey) throw new Error('D_ID_API_KEY not set');

  return fetch(`${D_ID_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Basic ${apiKey}`,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
}

export async function POST(request: Request) {
  const apiKey = process.env.D_ID_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'D_ID_API_KEY not configured' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { text } = await request.json();
  if (!text || text.length > 200) {
    return new Response('Missing or too long text', { status: 400 });
  }

  const cached = videoCache.get(text);
  if (cached && cached.expires > Date.now()) {
    return Response.json({ video_url: cached.url });
  }

  const sourceUrl =
    process.env.D_ID_SOURCE_URL ||
    'https://create-images-results.d-id.com/DefaultPresenters/Noelle_f/image.jpeg';

  try {
    const createRes = await didFetch('/talks', {
      method: 'POST',
      body: JSON.stringify({
        source_url: sourceUrl,
        script: {
          type: 'text',
          input: text,
          provider: {
            type: 'microsoft',
            voice_id: 'ko-KR-SunHiNeural',
          },
        },
        config: { stitch: true },
      }),
    });

    if (!createRes.ok) {
      const err = await createRes.text();
      return new Response(JSON.stringify({ error: `D-ID create failed: ${createRes.status}`, detail: err }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { id } = await createRes.json();

    for (let i = 0; i < 25; i++) {
      await new Promise((r) => setTimeout(r, 1000));

      const statusRes = await didFetch(`/talks/${id}`);
      if (!statusRes.ok) continue;

      const result = await statusRes.json();

      if (result.status === 'done' && result.result_url) {
        videoCache.set(text, {
          url: result.result_url,
          expires: Date.now() + 3600_000,
        });
        return Response.json({ video_url: result.result_url });
      }

      if (result.status === 'error' || result.status === 'rejected') {
        return new Response(
          JSON.stringify({ error: 'D-ID generation failed', detail: result }),
          { status: 502, headers: { 'Content-Type': 'application/json' } },
        );
      }
    }

    return new Response(JSON.stringify({ error: 'D-ID timeout' }), {
      status: 504,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}
