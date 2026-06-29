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
        content: `You are a music curator helping a Japanese person learn English through songs.

Based on this diary entry: "${text}"

Pick 3 Western songs that match the mood, theme, or emotions of this diary entry.
For each song, choose ONE short lyric line (under 15 words) that connects to the diary's feeling.

Respond ONLY with valid JSON:
{
  "songs": [
    {
      "title": "Song Title",
      "artist": "Artist Name",
      "lyric": "One short lyric line from the song",
      "connection_ja": "この曲を選んだ理由（日本語、20文字以内）"
    }
  ]
}

Choose well-known songs. The lyric must be a real line from the song. Keep it under 15 words.`
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
    return { statusCode: 500, body: JSON.stringify({ error: 'Music suggestion failed' }) };
  }
};
