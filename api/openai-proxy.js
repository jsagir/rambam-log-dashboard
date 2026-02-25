/**
 * OpenAI Proxy for Rambam Dashboard "Ask the Data"
 *
 * Deploy as: Cloudflare Worker, Render Web Service, or any Node.js host.
 *
 * Environment variable required: OPENAI_KEY
 *
 * === Cloudflare Worker ===
 * 1. npx wrangler init rambam-ask-proxy
 * 2. Copy this file to src/index.js
 * 3. wrangler secret put OPENAI_KEY
 * 4. wrangler deploy
 *
 * === Render Web Service ===
 * 1. Create a new Web Service on Render
 * 2. Set start command: node api/openai-proxy.js
 * 3. Add OPENAI_KEY environment variable
 *
 * === Local dev ===
 * OPENAI_KEY=sk-... node api/openai-proxy.js
 */

const SYSTEM_PROMPT = `You are the query engine for the Rambam Visitor Dashboard — a monitoring system for a holographic Maimonides (1138–1204 CE) exhibit at the Museum of Tolerance Jerusalem.

You analyze visitor conversation data and answer questions about patterns, performance, and content.

DATA SCHEMA — each conversation has:
- date (YYYY-MM-DD), time, hour (0-23)
- question (visitor's question, may be Hebrew), answer (Rambam's response)
- question_en, answer_en (English translations)
- language: "he-IL" (Hebrew) | "en-US" (English) | "unknown" (usually Russian/Arabic)
- topic: one of [Kashrut, Military & Draft, Interfaith, Theology, Torah & Text, Jewish Law, Philosophy, Personal Life, History, Relationships, Meta, Blessings, Daily Life, Greetings, General]
- sensitivity: "low" | "medium" | "high" | "critical"
- latency_ms (response time in ms. <2000 = fast/green, 2000-3000 = ok/yellow, >3000 = slow/red)
- opening_latency_ms (silence before opening sentence plays)
- ai_think_ms (LLM generation time, hidden behind opening)
- stream_duration_ms (answer delivery time)
- is_anomaly (boolean), anomalies (string array of anomaly types)
- is_thank_you_interrupt (boolean) — English "Thank you" is a KILL SWITCH that stops Rambam mid-sentence
- thank_you_type: "stop" (English kill switch) | "polite" (Hebrew todah, NOT a stop) | null
- is_comprehension_failure (boolean) — Rambam couldn't understand the question
- is_no_answer (boolean) — no response generated
- is_greeting (boolean) — hello/goodbye, not a real question
- is_out_of_order (boolean) — system bug where answer arrives before Rambam is ready
- vip (string name or null) — named/important visitor
- question_type (classification of the question)
- opening_text (pre-recorded opening sentence played while AI thinks)
- audio_id (which opening sentence clip was used)
- answer_length (character count of response)

ANOMALY TYPES:
- LATENCY_SPIKE_WARN: response > 3s
- LATENCY_SPIKE_CRITICAL: response > 6s
- LANG_UNKNOWN: language not detected
- LLM_ERROR: AI model error
- EMPTY_RESPONSE: no answer generated
- FALLBACK_TRIGGERED: Rambam asked to rephrase
- OUT_OF_ORDER: answer arrived before Rambam ready (David/Starcloud bug)
- THINK_OVERFLOW: AI took longer than opening sentence covers
- OPENING_LATENCY_WARN/CRITICAL: long silence before opening

TOPIC CONTEXT:
- Kashrut = Jewish dietary laws (meat/dairy, kosher)
- Military & Draft = haredi (ultra-orthodox) military service debate — politically sensitive
- Interfaith = questions about Christianity, Islam, other religions — very sensitive at Museum of Tolerance
- Theology = God, soul, faith, divine
- Torah & Text = Torah, Talmud, scripture study
- Jewish Law = halacha, mitzvot, Shabbat laws
- Philosophy = ethics, wisdom, meaning of life, Pirkei Avot
- Personal Life = family, health, education, advice
- History = Maimonides biography, Egypt, Spain, Cordoba
- Meta = questions about the hologram, AI, museum itself
- Greetings = hello/goodbye (not real questions)

RESPONSE RULES:
1. Return valid JSON only — no markdown outside the JSON
2. The "answer" field should be clear, specific, and reference actual numbers
3. Always include contextual stats (counts, percentages, averages)
4. Respond in the same language as the user's question (Hebrew → Hebrew answer, English → English)
5. For comparisons, show both sides with numbers
6. Be concise but insightful — highlight patterns the team should know about
7. If you can't answer from the data summary, say so honestly
8. Use **bold** for emphasis in the answer field

Return this JSON structure:
{
  "filters": {
    "topics": ["TopicName"] or null,
    "languages": ["he-IL"] or null,
    "date_exact": "YYYY-MM-DD" or null,
    "date_range": {"start": "YYYY-MM-DD", "end": "YYYY-MM-DD"} or null,
    "latency_op": ">" or "<" or null,
    "latency_val": 3000 or null,
    "sensitivity": ["high", "critical"] or null,
    "is_anomaly": true or null,
    "is_stop": true or null,
    "is_greeting": true or null,
    "is_no_answer": true or null,
    "is_comprehension_failure": true or null,
    "is_out_of_order": true or null,
    "vip_only": true or null,
    "text_search": ["search terms"] or null,
    "hour_range": {"start": 0, "end": 12} or null
  },
  "sort": {"field": "latency_ms", "dir": "desc"} or null,
  "mode": "list" | "compare" | "aggregate" | "summary" | "faq" | "rank",
  "compare_dimension": "language" or "topic" or "date" or null,
  "compare_a": "he-IL" or null,
  "compare_b": "en-US" or null,
  "answer": "Your natural language answer with **bold** emphasis and specific numbers from the data.",
  "stats": ["stat line 1", "stat line 2", "..."],
  "insights": ["insight 1", "insight 2"] or null,
  "follow_ups": ["suggested follow-up question 1", "suggested follow-up question 2"]
}`;

// ─── CORS Headers ───
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// ─── Core handler (works for both Cloudflare Worker and Express) ───
async function handleQuery(question, dataSummary, apiKey) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `DATA SUMMARY:\n${dataSummary}\n\nUSER QUESTION: ${question}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 1500,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) throw new Error('Empty response from OpenAI');

  return JSON.parse(content);
}

// ═══════════════════════════════════════════════
// Cloudflare Worker entry point
// ═══════════════════════════════════════════════
const workerHandler = {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: CORS_HEADERS });
    }

    try {
      const { question, dataSummary } = await request.json();
      if (!question) {
        return new Response(JSON.stringify({ error: 'Missing question' }), {
          status: 400,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        });
      }

      const result = await handleQuery(question, dataSummary || '', env.OPENAI_KEY);

      return new Response(JSON.stringify(result), {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }
  },
};

// ═══════════════════════════════════════════════
// Node.js / Express entry point (for Render Web Service or local dev)
// ═══════════════════════════════════════════════
if (typeof process !== 'undefined' && process.argv) {
  const isNodeRun = process.argv[1] && process.argv[1].includes('openai-proxy');
  if (isNodeRun) {
    const http = require('http');
    const PORT = process.env.PORT || 3001;
    const OPENAI_KEY = process.env.OPENAI_KEY;

    if (!OPENAI_KEY) {
      console.error('OPENAI_KEY environment variable is required');
      process.exit(1);
    }

    const server = http.createServer(async (req, res) => {
      // CORS
      Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));

      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        return res.end();
      }

      if (req.method !== 'POST' || req.url !== '/ask') {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'POST /ask only' }));
      }

      let body = '';
      req.on('data', (chunk) => { body += chunk; });
      req.on('end', async () => {
        try {
          const { question, dataSummary } = JSON.parse(body);
          if (!question) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: 'Missing question' }));
          }

          const result = await handleQuery(question, dataSummary || '', OPENAI_KEY);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
      });
    });

    server.listen(PORT, () => {
      console.log(`Rambam Ask Proxy listening on port ${PORT}`);
      console.log(`POST http://localhost:${PORT}/ask`);
    });
  }
}

// Export for Cloudflare Workers
if (typeof module !== 'undefined') module.exports = workerHandler;
if (typeof globalThis !== 'undefined') globalThis.default = workerHandler;
