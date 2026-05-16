require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const OpenAI = require('openai');
const axios = require('axios');
const { buildSystemPrompt, buildUserPrompt } = require('./prompts');

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
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 1024,
      messages: [
        { role: 'system', content: buildSystemPrompt() },
        { role: 'user', content: buildUserPrompt({ first_name, last_name, age, concern, slot, note: note || '' }) },
      ],
    });

    const emailBody = completion.choices[0].message.content;

    await axios.post(process.env.MAKE_WEBHOOK_URL, {
      first_name,
      last_name,
      email,
      concern,
      slot,
      email_subject: `Your CareFirst Appointment is Confirmed, ${first_name}!`,
      email_body: emailBody,
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Intake error:', err?.message || err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`CareFirst server running on http://localhost:${PORT}`));
