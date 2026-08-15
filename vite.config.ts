import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import express from 'express';
import { GoogleGenAI } from '@google/genai';

function expressApiPlugin(): Plugin {
  return {
    name: 'express-api-plugin',
    configureServer(server) {
      const app = express();
      app.use(express.json());

      // Gemini PR Response Endpoint
      app.post('/api/gemini/generate-response', async (req, res) => {
        try {
          const { query, commentType, rumorContext } = req.body;
          const apiKey = process.env.GEMINI_API_KEY;

          if (!apiKey) {
            return res.status(400).json({
              error: 'GEMINI_API_KEY environment variable is missing.'
            });
          }

          const ai = new GoogleGenAI({
            apiKey,
            httpOptions: {
              headers: {
                'User-Agent': 'aistudio-build',
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
            model: 'gemini-3.6-flash',
            contents: systemPrompt,
            config: {
              responseMimeType: 'application/json',
            }
          });

          const responseText = response.text || '{}';
          let parsed;
          try {
            parsed = JSON.parse(responseText);
          } catch {
            parsed = { draftResponse: responseText };
          }
          res.json({ success: true, data: parsed });
        } catch (err: any) {
          console.error('Gemini API Error:', err);
          res.status(500).json({
            success: false,
            error: err.message || 'Failed to generate response'
          });
        }
      });

      server.middlewares.use(app);
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), expressApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
