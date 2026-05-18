const CONCERN_INSTRUCTIONS = {
  'General Checkup': [
    'Fast for at least 8 hours before your visit if blood work may be needed.',
    'Bring a valid photo ID and your insurance card.',
    'Prepare a list of all current medications and supplements.',
    'Wear comfortable, easy-to-remove clothing.',
    'Arrive 10 minutes early to complete any remaining paperwork.',
  ],
  'Dental': [
    'Brush and floss thoroughly before your appointment.',
    'Make note of any tooth pain, sensitivity, or bleeding gums to mention to your dentist.',
    'Avoid eating or drinking (except water) for 2 hours before your visit.',
    'Bring a list of all current medications, including blood thinners or antibiotics.',
  ],
  'Ortho': [
    'Bring any recent X-rays, MRI scans, or medical reports related to your condition.',
    'Wear loose, comfortable clothing that allows easy access to the affected area.',
    'Note your pain level on a scale of 1–10 and when it tends to be at its worst.',
    'Avoid strenuous physical activity on the day of your appointment.',
  ],
  'Mental Health': [
    'Arrive in a calm, comfortable state — a short walk or a few deep breaths beforehand can help.',
    'Bring any personal notes on your feelings, symptoms, or recent triggers.',
    'Complete the intake form that will be sent to your email before your session.',
    'Everything you share is strictly confidential and protected under HIPAA guidelines.',
  ],
};

function buildSystemPrompt() {
  return `You are a warm, professional medical receptionist at CareFirst Health, a multi-specialty clinic.
Your role is to write a personalized appointment confirmation email for a patient who just booked online.

Tone & style:
- Address the patient by their first name throughout
- Be warm, reassuring, and professional — not clinical or robotic
- Confirm their concern and preferred appointment slot clearly
- Include the concern-specific pre-visit instructions exactly as provided (do not add or remove any)
- Keep the email concise but human — no unnecessary filler
- End every email with: "Warm regards,\nThe CareFirst Team"

Hard rules:
- Output the email body ONLY — no subject line, no markdown formatting
- Do NOT invent clinic addresses, doctor names, phone numbers, or exact appointment times not given
- Do NOT add generic advice beyond the provided instructions`;
}

function buildUserPrompt({ first_name, last_name, age, concern, slot, note }) {
  const instructions = CONCERN_INSTRUCTIONS[concern] || [];
  const instructionList = instructions.map((item, i) => `${i + 1}. ${item}`).join('\n');
  const noteSection = note ? `\nPatient's additional note: "${note}"` : '';

  return `Write a personalized appointment confirmation email for this patient:

Name: ${first_name} ${last_name}
Age: ${age}
Primary Concern: ${concern}
Preferred Appointment Slot: ${slot}${noteSection}

Pre-visit instructions to include for ${concern}:
${instructionList}

Write the full email body now.`;
}

function buildSpamPrompt({ first_name, last_name, email, age, concern, slot, note }) {
  return `You are a spam detection system for a medical clinic intake form. Analyze this submission and return a JSON object ONLY — no explanation, no markdown, just raw JSON.

Submission:
- First Name: ${first_name}
- Last Name: ${last_name}
- Email: ${email}
- Age: ${age}
- Concern: ${concern}
- Slot: ${slot}
- Note: ${note || '(none)'}

Evaluate for spam signals such as: gibberish or random names, fake-looking email addresses, nonsensical or promotional note content, mismatched age/concern, repeated filler words, or bot-like patterns.

Return exactly this JSON structure:
{
  "spam_score": <integer 0-100>,
  "reason": "<one sentence explaining the score>"
}

0 = clearly legitimate, 100 = obvious spam.`;
}

module.exports = { buildSystemPrompt, buildUserPrompt, buildSpamPrompt };
