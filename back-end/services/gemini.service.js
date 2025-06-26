// services/gemini.service.js
const axios = require('axios');
const API_KEY = process.env.GEMINI_API_KEY;
const MODEL   = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

if (!API_KEY) {
  throw new Error('Missing GEMINI_API_KEY in .env');
}

module.exports.generate = async ({ prompt }) => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;
  const body = {
    contents: [
      { parts: [{ text: prompt }] }
    ]
  };

  const { data } = await axios.post(url, body, {
    headers: { 'Content-Type': 'application/json' }
  });

  // Trích candidate đầu tiên
  const cand = Array.isArray(data.candidates) && data.candidates[0];
  if (!cand) {
    return 'Xin lỗi, không nhận được phản hồi từ AI.';
  }

  // 1) Nếu có content kiểu string
  if (typeof cand.content === 'string') {
    return cand.content;
  }

  // 2) Nếu content.parts tồn tại
  if (cand.content && Array.isArray(cand.content.parts)) {
    return cand.content.parts.map(p => p.text).join('');
  }

  // 3) Nếu cand.output.content (nếu có)
  if (cand.output && typeof cand.output.content === 'string') {
    return cand.output.content;
  }

  // 4) Fallback: stringify candidate
  return JSON.stringify(cand);
};
