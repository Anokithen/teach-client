import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ message: 'OpenAI is not configured yet. Add OPENAI_API_KEY to .env.local and restart the app.' }, { status: 503 });
  const { ageGroup, readingLevel, idea } = await request.json() as { ageGroup?: string; readingLevel?: string; idea?: string };
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o-mini', response_format: { type: 'json_object' }, temperature: 0.8,
      messages: [{ role: 'system', content: 'You write safe, warm, playful children\'s early-reader stories. Return only valid JSON with title and text_content. Never include scary, violent, commercial, or personal-data content.' }, {
        role: 'user', content: `Create a complete original reading book for ages ${ageGroup || '6-8'}, level ${readingLevel || 'beginner'}. Theme idea: ${idea || 'a kind animal friend discovers something wonderful'}. Use short sentences, clear vocabulary, a happy ending, and roughly 8-12 short sentences.`
      }],
    }),
  });
  const result = await response.json() as { choices?: Array<{ message?: { content?: string } }>; error?: { message?: string } };
  if (!response.ok) return NextResponse.json({ message: result.error?.message || 'OpenAI could not create a story right now.' }, { status: response.status });
  try {
    const draft = JSON.parse(result.choices?.[0]?.message?.content || '{}');
    if (!draft.title || !draft.text_content) throw new Error();
    return NextResponse.json({ title: String(draft.title), text_content: String(draft.text_content) });
  } catch { return NextResponse.json({ message: 'The story draft was not in the expected format. Please try again.' }, { status: 502 }); }
}
