import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({
  apiKey: apiKey || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Accept large payloads for image uploads (base64)
  app.use(express.json({ limit: '35mb' }));
  app.use(express.urlencoded({ extended: true, limit: '35mb' }));

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Corrosion analysis endpoint
  app.post('/api/analyze-corrosion', async (req, res) => {
    try {
      const { image, mimeType } = req.body;

      if (!image) {
        return res.status(400).json({
          error: 'Image data is required.',
        });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({
          error: 'GEMINI_API_KEY is not configured on the server.',
        });
      }

      // Clean base64 data if data URL prefix exists
      let cleanBase64 = image;
      let detectedMime = mimeType || 'image/jpeg';

      if (image.includes('base64,')) {
        const parts = image.split('base64,');
        cleanBase64 = parts[1];
        const match = parts[0].match(/:(.*?);/);
        if (match && match[1]) {
          detectedMime = match[1];
        }
      }

      const systemInstruction = `You are a certified metallurgical and materials inspection assistant specialized in visual corrosion assessment for industrial metals, structural steel, aluminum, copper, brass, and alloys.
Your task is to analyze the provided photograph and return a structured JSON report.

Rules:
1. First, check if the photograph depicts an actual metal surface or metallic component (e.g. pipe, plate, beam, bolt, sheet, machinery, weld, vehicle body, tool, structure).
   - If it is NOT a metal surface (e.g., skin, clothing, food, wood, plastic, animal, scenery, text screenshot, paper), set "is_metal_surface": false, "classification": "Non-corroded", "confidence": 0, "severity": "None", and explain what object is shown in "notes".
2. If it IS a metal surface:
   - "is_metal_surface": true
   - "classification": MUST be either "Corroded" or "Non-corroded".
     * "Corroded": Visible signs of rust (iron oxide), pitting, crevice attack, galvanic corrosion, white rust (zinc oxide), green verdigris patina (copper), dark flaking, tarnishing with material loss or exfoliation.
     * "Non-corroded": Clean, unoxidized, intact paint/coating with zero substrate breakdown, polished, mill-finished, or passivated metal with no surface degradation.
   - "confidence": Integer percentage between 0 and 100 representing inspection certainty.
   - "severity": If "Corroded", categorize as "Mild" (superficial discoloration/light flash rust), "Moderate" (visible pitting, granular scaling, patchy spread), or "Severe" (deep pitting, heavy structural flaking, extensive material loss). If "Non-corroded", severity MUST be "None".
   - "notes": 1-2 concise professional sentences summarizing visual inspection findings.

Output ONLY valid JSON matching the exact schema.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: detectedMime,
                data: cleanBase64,
              },
            },
            {
              text: 'Perform metallurgical visual inspection on this image for metal surface corrosion detection. Return the JSON result.',
            },
          ],
        },
        config: {
          systemInstruction,
          temperature: 0.1,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              is_metal_surface: {
                type: Type.BOOLEAN,
                description: 'True if metal surface, false otherwise.',
              },
              classification: {
                type: Type.STRING,
                description: '"Corroded" or "Non-corroded".',
              },
              confidence: {
                type: Type.NUMBER,
                description: 'Percentage 0-100.',
              },
              severity: {
                type: Type.STRING,
                description: '"Mild", "Moderate", "Severe", or "None".',
              },
              notes: {
                type: Type.STRING,
                description: 'Brief technical observation.',
              },
            },
            required: ['is_metal_surface', 'classification', 'confidence', 'severity'],
          },
        },
      });

      const rawText = response.text || '{}';
      let parsed;
      try {
        parsed = JSON.parse(rawText);
      } catch (e) {
        // Fallback regex extraction if needed
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Failed to parse Gemini response as JSON');
        }
      }

      // Safe normalization
      const isMetal = Boolean(parsed.is_metal_surface);
      let classification = parsed.classification === 'Corroded' ? 'Corroded' : 'Non-corroded';
      let confidence = Math.min(100, Math.max(0, Math.round(Number(parsed.confidence) || 0)));
      let severity = ['Mild', 'Moderate', 'Severe', 'None'].includes(parsed.severity)
        ? parsed.severity
        : (classification === 'Corroded' ? 'Moderate' : 'None');

      if (!isMetal) {
        classification = 'Non-corroded';
        confidence = 0;
        severity = 'None';
      }

      res.json({
        is_metal_surface: isMetal,
        classification,
        confidence,
        severity,
        notes: parsed.notes || '',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error('Error analyzing image with Gemini:', err);
      res.status(500).json({
        error: err.message || 'Inspection analysis failed. Please try again.',
      });
    }
  });

  // Serve Vite in development or static dist in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Corrosion Detection app running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
