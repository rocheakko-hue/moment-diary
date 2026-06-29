require('dotenv').config();
const express = require('express');
const path = require('path');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
const PORT = process.env.PORT || 3000;
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

app.post('/api/correct', async (req, res) => {
  const { text } = req.body;
  if (!text || !text.trim()) return res.status(400).json({ error: 'Text is required' });

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
    res.json(JSON.parse(jsonMatch[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'AI correction failed' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
