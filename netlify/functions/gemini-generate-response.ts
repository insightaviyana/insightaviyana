import type { Handler } from '@netlify/functions';
import { GoogleGenAI } from '@google/genai';

// Netlify Function equivalent of the Vite dev-server middleware in vite.config.ts.
// `npm run dev` serves /api/gemini/generate-response via that Express middleware,
// which only exists in the local dev server process. On Netlify (a static build),
// that middleware never runs -- this function is what actually answers the
// request once the site is deployed. Requires GEMINI_API_KEY to be set as a
// Netlify environment variable (Site configuration -> Environment variables).
export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { query, commentType, rumorContext } = JSON.parse(event.body || '{}');
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'GEMINI_API_KEY environment variable is missing.' })
      };
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });

    const systemPrompt = `You are the official PR AI Assistant for Aviyana Ceylon Resort Sri Lanka (insight.aviyana.lk), grand opening August 2026.
Core Strategy: Fact-based PR & High-Authority SEO Publishing.
Core Principle: "Unwavering Excellence, Total Transparency & Authentic Hospitality — Elevating Sri Lanka's Ceylon Benchmark to the World" (Dignified, polite, transparent, ultra-luxury Ceylon tone).

Do NOT engage in heated arguments or aggressive counter-claims. Provide calm, direct, polite, and verified answers referring to official environmental/government clearance approvals (Central Environmental Authority EIA Approval 2025), clean water community projects, local employment charter, and official updates on insight.aviyana.lk.

Task: Draft an official PR response for a inquiry/comment/rumor.
Type: "${commentType || 'general'}"
User Query/Comment: "${query}"
Context: "${rumorContext || 'None'}"

Return ONLY a valid JSON object matching this schema:
{
  "draftResponse": "string (1-3 paragraphs in calm, polite, luxury-toned English)",
  "sinhalaTranslation": "string (accurate polite Sinhala translation)",
  "suggestedActions": ["array of 2-3 tactical operational steps for social manager"],
  "toneRating": "string (e.g., Dignified & Calm - Ceylon Standard)",
  "keyFactsIncluded": ["array of bullet points of official verified facts used"]
}`;

    const response = await ai.models.generateContent({
      // gemini-2.5-flash stopped accepting new users/projects (see error:
      // "no longer available to new users") -- gemini-3.6-flash is the
      // current generally-available stable Flash model as of Aug 2026.
      model: 'gemini-3.6-flash',
      contents: systemPrompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const responseText = response.text || '{}';
    let parsed;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      parsed = { draftResponse: responseText };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, data: parsed })
    };
  } catch (err: any) {
    console.error('Gemini API Error:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, error: err.message || 'Failed to generate response' })
    };
  }
};
