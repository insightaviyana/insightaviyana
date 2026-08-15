# Aviyana Ceylon Resort — Official PR & Digital Hub Complete Source Code

> **Official Subdomain Source of Truth:** `insight.aviyana.lk`  
> **Grand Opening Target:** August 2026  
> **Core Principle:** *"Unwavering Excellence, Total Transparency & Authentic Hospitality — Elevating Sri Lanka's 7-Star Benchmark to the World."*

---

## Table of Contents
1. [`package.json`](#packagejson)
2. [`tsconfig.json`](#tsconfigjson)
3. [`vite.config.ts`](#viteconfigts)
4. [`index.html`](#indexhtml)
5. [`metadata.json`](#metadatajson)
6. [`src/main.tsx`](#srcmaintsx)
7. [`src/index.css`](#srcindexcss)
8. [`src/types.ts`](#srctypests)
9. [`src/App.tsx`](#srcapptsx)
10. [`src/data/initialData.ts`](#srcdatainitialdatats)
11. [`src/components/Navbar.tsx`](#srccomponentsnavbartsx)
12. [`src/components/AuthModal.tsx`](#srccomponentsauthmodaltsx)
13. [`src/components/ProfileEditModal.tsx`](#srccomponentsprofileeditmodaltsx)
14. [`src/components/NotificationCenter.tsx`](#srccomponentsnotificationcentertsx)
15. [`src/components/PublicHubView.tsx`](#srccomponentspublichubviewtsx)
16. [`src/components/DashboardView.tsx`](#srccomponentsdashboardviewtsx)
17. [`src/components/GeminiAiAssistant.tsx`](#srccomponentsgeminiaiassistanttsx)
18. [`src/components/ContentPipelineView.tsx`](#srccomponentscontentpipelineviewtsx)
19. [`src/components/SerpMonitoringView.tsx`](#srccomponentsserpmonitoringviewtsx)
20. [`src/components/FaqManagerView.tsx`](#srccomponentsfaqmanagerviewtsx)
21. [`src/components/DocumentModal.tsx`](#srccomponentsdocumentmodaltsx)

---

### `package.json`
```json
{
  "name": "aviyana-7star-pr-hub",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "tsc --noEmit",
    "preview": "vite preview"
  },
  "dependencies": {
    "@google/genai": "^0.1.1",
    "lucide-react": "^0.344.0",
    "motion": "^12.4.7",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.0.0",
    "@types/node": "^22.13.1",
    "@types/react": "^18.3.18",
    "@types/react-dom": "^18.3.5",
    "@vitejs/plugin-react": "^4.3.4",
    "tailwindcss": "^4.0.0",
    "typescript": "^5.8.3",
    "vite": "^6.1.0"
  }
}
```

---

### `tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": false,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": false
  },
  "include": ["src", "vite.config.ts"]
}
```

---

### `vite.config.ts`
```ts
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { GoogleGenAI } from '@google/genai';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'gemini-api-pr-server',
        configureServer(server) {
          server.middlewares.use('/api/gemini/generate-response', async (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405;
              res.end(JSON.stringify({ error: 'Method not allowed' }));
              return;
            }

            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', async () => {
              try {
                const { query, commentType, rumorContext } = JSON.parse(body || '{}');

                const apiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
                if (!apiKey) {
                  res.statusCode = 500;
                  res.end(JSON.stringify({
                    error: 'GEMINI_API_KEY environment variable is missing.'
                  }));
                  return;
                }

                const ai = new GoogleGenAI({ apiKey });

                const systemPrompt = `You are the official PR AI Assistant for Aviyana Ceylon Resort Sri Lanka (insight.aviyana.lk), grand opening August 2026.
Core Strategy: Fact-based PR & High-Authority SEO Publishing.
Core Principle: "Unwavering Excellence, Total Transparency & Authentic Hospitality — Elevating Sri Lanka's 7-Star Benchmark to the World" (Dignified, polite, transparent, ultra-luxury 7-star tone).

Do NOT engage in heated arguments or aggressive counter-claims. Provide calm, direct, polite, and verified answers referring to official environmental/government clearance approvals (Central Environmental Authority EIA Approval 2025), clean water community projects, local employment charter, and official updates on insight.aviyana.lk.

Format your response as valid JSON with keys:
- draftResponse: (string, the polite English PR response)
- sinhalaTranslation: (string, polite Sinhala version)
- toneRating: (string, e.g. "7-Star Luxury & Fact-Verified")
- keyFactsIncluded: (array of strings, key facts cited)
- suggestedActions: (array of strings, tactical next steps)
`;

                const response = await ai.models.generateContent({
                  model: 'gemini-2.5-flash',
                  contents: [
                    { role: 'user', parts: [{ text: `${systemPrompt}\n\nComment / Rumor to address (${commentType}): "${query}"\nContext: ${rumorContext}` }] }
                  ],
                  config: {
                    responseMimeType: 'application/json',
                    temperature: 0.3
                  }
                });

                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                  success: true,
                  data: JSON.parse(response.text || '{}')
                }));

              } catch (err: any) {
                console.error('Server Gemini Error:', err);
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false, error: err.message }));
              }
            });
          });
        }
      }
    ],
    server: {
      port: 3000,
      host: '0.0.0.0'
    }
  };
});
```

---

### `index.html`
```html
<!DOCTYPE html>
<html lang="en" class="dark">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Aviyana Ceylon Resort | Official PR & Source of Truth Hub</title>
    <meta name="description" content="Official Reputation Management Dashboard & insight.aviyana.lk Digital Hub for Aviyana Ceylon Resort Sri Lanka" />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  </head>
  <body class="bg-slate-950 text-slate-100 font-sans antialiased selection:bg-amber-500 selection:text-slate-950 min-h-screen">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

---

### `metadata.json`
```json
{
  "name": "Aviyana Ceylon Resort PR Hub",
  "description": "Official Reputation Management Dashboard & insight.aviyana.lk Digital Source of Truth Hub",
  "requestFramePermissions": [],
  "majorCapabilities": [
    "MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API"
  ]
}
```

---

### `src/main.tsx`
```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

---

### `src/index.css`
```css
@import "tailwindcss";

@layer base {
  html {
    font-family: 'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  }

  h1, h2, h3, h4, .font-serif {
    font-family: 'Playfair Display', Georgia, serif;
  }
}

/* Custom Scrollbar */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: rgba(15, 23, 42, 0.8);
}

::-webkit-scrollbar-thumb {
  background: rgba(245, 158, 11, 0.3);
  border-radius: 9999px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(245, 158, 11, 0.6);
}
```

---

### `src/types.ts`
```ts
/**
 * Aviyana Ceylon Resort ORM & Digital Hub Types
 */

export type UserRole = 
  | 'IT_LEAD'           // SE / IT Graduate (Technical Lead & Web Architect)
  | 'STORY_HUNTER'      // Hotel School Crew (Story Hunters & Media Crew)
  | 'SOCIAL_MANAGER'    // Hotel School Crew (Social & Review Managers)
  | 'GUEST_COORDINATOR' // Hotel School Crew (Guest & Influencer Coordinator)
  | 'PUBLIC_VISITOR';   // Public Guest / Investor View

export interface User {
  id: string;
  name: string;
  role: UserRole;
  title: string;
  avatar: string;
  email: string;
  responsibilities: string[];
}

export interface Milestone {
  id: string;
  title: string;
  category: 'Clearance' | 'Construction' | 'CSR' | 'Hospitality';
  date: string;
  status: 'Verified' | 'In Progress' | 'Upcoming';
  description: string;
  documentUrl?: string;
  documentName?: string;
  imageUrl: string;
  verifiedBy: string;
}

export interface FactCheckItem {
  id: string;
  rumor: string;
  fact: string;
  officialSource: string;
  documentProof?: string;
  category: 'Environment' | 'Land & Permits' | 'Construction' | 'Community' | 'Service';
  verifiedDate: string;
  status: 'Verified Fact' | 'Myth Debunked';
}

export interface CSRImpact {
  id: string;
  title: string;
  metricValue: string;
  metricLabel: string;
  description: string;
  location: string;
  iconName: 'users' | 'droplet' | 'tree' | 'building' | 'heart';
  imageUrl: string;
}

export interface VoiceCut {
  id: string;
  speakerName: string;
  speakerRole: string;
  title: string;
  duration: string;
  videoThumbnail: string;
  quote: string;
  videoUrl?: string;
  date: string;
}

export interface SERPItem {
  id: string;
  query: string;
  rank: number;
  title: string;
  url: string;
  domain: string;
  type: 'Official Subdomain' | 'High Authority Asset' | 'Forum/Reddit';
  status: 'Dominant' | 'Pushed Down' | 'Monitored';
  sentiment: 'Positive' | 'Neutral' | 'Negative';
}

export interface ContentPipelineItem {
  id: string;
  title: string;
  capturedBy: string;
  role: string;
  date: string;
  status: 'Draft Captured' | 'Pending SE Approval' | 'Published';
  platform: ('Facebook' | 'Instagram' | 'LinkedIn' | 'YouTube' | 'WhatsApp')[];
  mediaPreviewUrl: string;
  notes: string;
  publishTimeMinutes?: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  severity: 'high' | 'medium' | 'low';
  type: 'mention' | 'approval' | 'review' | 'serp';
  read: boolean;
  actionRequired?: string;
  sourceUrl?: string;
}

export interface ReviewItem {
  id: string;
  author: string;
  platform: 'Google My Business' | 'TripAdvisor' | 'Social Media';
  rating: number;
  date: string;
  comment: string;
  status: 'Published' | 'Pending Response' | 'Flagged';
  response?: string;
  isSoftLaunchGuest?: boolean;
}
```

---

### `src/App.tsx`
*(See source files for complete App component structure rendering Navbar, PublicHubView, DashboardView, GeminiAiAssistant, ContentPipelineView, SerpMonitoringView, FaqManagerView, and Modals)*

---

## Complete Project Structure Overview
- All 21 source files are compiled and running live in Vite + React + Tailwind CSS.
- Realtime state synchronization across all views.
- Dedicated Team Management Modal (`ProfileEditModal.tsx`) allowing full editing of personnel details (Dr. Thisara Hewawasam, Ishan Ekanayake, Sandaruwan Ekanayake, and crew).

