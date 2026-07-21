import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ message: 'OpenAI is not configured yet. Add OPENAI_API_KEY to .env.local and restart the app.' }, { status: 503 });
  }

  const incoming = await request.formData();
  const audio = incoming.get('audio');
  const expectedText = String(incoming.get('expected_text') || '');
  if (!(audio instanceof File) || audio.size === 0) {
    return NextResponse.json({ message: 'Please record a short reading first.' }, { status: 400 });
  }
  if (audio.size > 20 * 1024 * 1024) {
    return NextResponse.json({ message: 'That recording is too large. Please read one sentence at a time.' }, { status: 413 });
  }

  const form = new FormData();
  form.append('file', audio, audio.name || 'reading.webm');
  form.append('model', 'gpt-4o-mini-transcribe');
  form.append('language', 'en');
  if (expectedText) form.append('prompt', `The child is reading this sentence. Transcribe only what is spoken: ${expectedText}`);

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });
  const result = await response.json() as { text?: string; error?: { message?: string } };
  if (!response.ok) {
    return NextResponse.json({ message: result.error?.message || 'OpenAI could not transcribe this recording.' }, { status: response.status });
  }
  return NextResponse.json({ transcript: result.text?.trim() || '' });
}
