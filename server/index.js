require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const OpenAI = require('openai');
const axios = require('axios');
const { buildSystemPrompt, buildUserPrompt, buildSpamPrompt } = require('./prompts');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post('/intake', async (req, res) => {
  const { first_name, last_name, email, age, concern, slot, note } = req.body;

  if (!first_name || !last_name || !email || !age || !concern || !slot) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  const validConcerns = ['General Checkup', 'Dental', 'Ortho', 'Mental Health'];
  if (!validConcerns.includes(concern)) {
    return res.status(400).json({ error: 'Invalid concern value.' });
  }

  try {
    const [emailCompletion, spamCompletion] = await Promise.all([
      openai.chat.completions.create({
        model: 'gpt-4o',
        max_tokens: 1024,
        messages: [
          { role: 'system', content: buildSystemPrompt() },
          { role: 'user', content: buildUserPrompt({ first_name, last_name, age, concern, slot, note: note || '' }) },
        ],
      }),
      openai.chat.completions.create({
        model: 'gpt-4o',
        max_tokens: 128,
        messages: [
          { role: 'user', content: buildSpamPrompt({ first_name, last_name, email, age, concern, slot, note: note || '' }) },
        ],
      }),
    ]);

    const emailBody = emailCompletion.choices[0].message.content;

    let spam_score = 0;
    let spam_reason = '';
    try {
      const spamRaw = spamCompletion.choices[0].message.content
        .trim()
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/, '');
      const spamResult = JSON.parse(spamRaw);
      spam_score = spamResult.spam_score ?? 0;
      spam_reason = spamResult.reason ?? '';
    } catch {
      console.warn('Spam score parse failed — defaulting to 0');
    }

    await axios.post(process.env.MAKE_WEBHOOK_URL, {
      first_name,
      last_name,
      email,
      age,
      concern,
      slot,
      note: note || '',
      spam_score,
      spam_reason,
      email_subject: `Your CareFirst Appointment is Confirmed, ${first_name}!`,
      email_body: emailBody,
    }, {
      headers: { 'x-make-apikey': process.env.MAKE_WEBHOOK_API_KEY },
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Intake error:', err?.message || err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`CareFirst server running on http://localhost:${PORT}`));
