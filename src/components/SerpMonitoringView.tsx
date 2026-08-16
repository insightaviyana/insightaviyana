import React, { useState } from 'react';
import { 
  Search, 
  AlertTriangle, 
  Code, 
  Copy, 
  Check
} from 'lucide-react';

interface SerpMonitoringViewProps {}

export const SerpMonitoringView: React.FC<SerpMonitoringViewProps> = () => {
  const [copiedSchema, setCopiedSchema] = useState(false);

  // JSON-LD Schema Generator for SE IT Lead (From PDF Section 3)
  const generateSchemaMarkup = () => {
    return JSON.stringify({
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "AboutUs",
          "name": "Aviyana Ceylon Resort Sri Lanka Official Source of Truth",
          "url": "https://insight.aviyana.lk",
          "description": "Official reputation management and milestone verification hub for Aviyana Ceylon Resort.",
          "knowsAbout": ["Central Environmental Authority Clearances", "Ceylon Luxury Hospitality", "Local Employment Charter"]
        },
        {
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "Does Aviyana Ceylon Resort have Central Environmental Authority approval?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes, Aviyana obtained full Environmental Impact Assessment (EIA) approval from the Central Environmental Authority in 2025 (Ref #CEA/7S/LK-2025)."
              }
            }
          ]
        },
        {
          "@type": "NewsArticle",
          "headline": "Aviyana Ceylon Resort Strategic Grand Opening Announced for August 2026",
          "image": ["https://images.unsplash.com/photo-1571896349842-33c89424de2d"],
          "datePublished": "2026-07-01",
          "author": {
            "@type": "Organization",
            "name": "Aviyana Resort PR Team"
          }
        }
      ]
    }, null, 2);
  };

  const handleCopySchema = () => {
    navigator.clipboard.writeText(generateSchemaMarkup());
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 2500);
  };

  return (
    <div id="serp-monitoring-root" className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 space-y-8 pb-20">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950/30 to-slate-900 border border-amber-500/30 rounded-2xl p-6">
        <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
          <Search size={16} />
          <span>SERP Suppression & Organic Ranking Center</span>
        </div>
        <h1 className="text-2xl font-serif font-bold text-white">
          Search Engine Suppression Strategy (Reddit & Forum Control)
        </h1>
        <p className="text-xs text-slate-300 mt-1 max-w-2xl">
          By flooding search engine results with authentic, high-authority official content (Medium, LinkedIn, YouTube, insight.aviyana.lk), negative unverified threads are pushed down to Page 2 & 3.
        </p>
      </div>

      {/* Honest disclosure: no real rank-tracking API is connected -- see
          the "Not Connected" panel below where the fake ranking simulator
          used to be, instead of showing fabricated rank numbers. */}
      <div className="flex items-start gap-2.5 p-3.5 bg-amber-950/50 border border-amber-500/40 rounded-xl text-xs text-amber-200">
        <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
        <span>
          <strong className="text-amber-300">No live ranking data connected.</strong> This tab previously showed placeholder/fabricated search rankings presented as if real. Real rank tracking needs a Google Search Console or third-party rank-tracking API connected -- ask if you want that built.
        </span>
      </div>

      {/* Strategy Highlights Cards (From PDF Section 5) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="p-4 rounded-xl bg-slate-900 border border-amber-500/20">
          <div className="font-bold text-amber-300 mb-1">1. High Domain Authority Linking</div>
          <p className="text-slate-300">Connect insight.aviyana.lk directly to main domain aviyana.lk and publish official press releases.</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-amber-500/20">
          <div className="font-bold text-amber-300 mb-1">2. Asset Multi-Channel Dominance</div>
          <p className="text-slate-300">Active optimized profiles on Medium, LinkedIn, YouTube, and TripAdvisor to occupy Page 1 top 5 slots.</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-amber-500/20">
          <div className="font-bold text-amber-300 mb-1">3. Keyword Optimization</div>
          <p className="text-slate-300">Targeting queries like "Aviyana Ceylon Hotel Sri Lanka updates" so official links occupy Page 1.</p>
        </div>
      </div>

      {/* Not Connected state -- replaces the old fake ranking simulator
          (query tabs + a hardcoded "88% Dominance Score" + made-up rank
          numbers). There's no real API integration for this, so rather than
          keep showing fabricated numbers next to a small disclaimer, this is
          now an honest empty state until a real rank-tracking API is wired up. */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center space-y-3">
        <div className="w-14 h-14 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
          <Search size={26} />
        </div>
        <h3 className="font-serif font-bold text-base text-white">Rank Tracking Not Connected</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Live Google search rankings will appear here once a Google Search Console or third-party rank-tracking API is connected. No data is fabricated or estimated in the meantime.
        </p>
      </div>

      {/* SEO Schema Generator Box for SE Lead -- this part is real and
          working (generates actual JSON-LD schema markup), not mock data. */}
      <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Code className="text-amber-400" size={18} />
            <div>
              <h3 className="font-serif font-bold text-base text-white">Technical SEO Schema Markup (SE Lead)</h3>
              <p className="text-xs text-slate-400">AboutUs, FAQPage & NewsArticle JSON-LD Schema for Elementor/WordPress</p>
            </div>
          </div>

          <button
            onClick={handleCopySchema}
            className="px-3.5 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition-all flex items-center space-x-1.5 shadow-md"
          >
            {copiedSchema ? <Check size={14} /> : <Copy size={14} />}
            <span>{copiedSchema ? 'Schema Copied!' : 'Copy JSON-LD'}</span>
          </button>
        </div>

        <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-amber-300/90 font-mono overflow-x-auto max-h-64">
          {generateSchemaMarkup()}
        </pre>
      </div>

    </div>
  );
};
