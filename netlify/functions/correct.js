const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let text;
  try {
    ({ text } = JSON.parse(event.body));
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  if (!text?.trim()) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Text is required' }) };
  }

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `You are an English teacher helping a Japanese learner write a diary.

The student wrote: "${text}"

Respond ONLY with valid JSON in this exact format:
{
  "corrected": "the corrected sentence",
  "corrections": [
    {"original": "wrong part", "fixed": "correct part", "explanation_ja": "日本語での説明"}
  ],
  "examples": [
    "Example sentence 1 using the corrected grammar pattern.",
    "Example sentence 2 using the corrected grammar pattern.",
    "Example sentence 3 using the corrected grammar pattern."
  ],
  "encouragement_ja": "ひとことの励まし（日本語）"
}

If already correct, set corrections to [] and corrected to the original sentence.`
      }]
    });

    const content = message.content[0].text;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Invalid response');

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: jsonMatch[0]
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: 'AI correction failed' }) };
  }
};
