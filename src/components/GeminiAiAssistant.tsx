import React, { useState } from 'react';
import { 
  Bot, 
  Sparkles, 
  Send, 
  Copy, 
  Check, 
  AlertCircle, 
  FileText, 
  Globe, 
  MessageSquare, 
  RefreshCw,
  Award
} from 'lucide-react';

interface GeminiAiAssistantProps {
  initialPrompt?: string;
}

export const GeminiAiAssistant: React.FC<GeminiAiAssistantProps> = ({ initialPrompt = '' }) => {
  const [query, setQuery] = useState(initialPrompt || '');
  const [commentType, setCommentType] = useState('social_rumor');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const presets = [
    {
      label: 'Environmental Permitting Rumor',
      type: 'environment_rumor',
      text: 'There are posts on forums claiming Aviyana is building on forest reserve land without environmental clearances.'
    },
    {
      label: 'Google My Business Negative Comment',
      type: 'gmb_review',
      text: 'Someone left a 2-star comment saying: "Resort looks overpriced and delayed. Is it even open?"'
    },
    {
      label: 'Community Water & Local Employment Inquiry',
      type: 'community_inquiry',
      text: 'Inquiry asking if Aviyana hires local Sri Lankan hotel school graduates and supports local village infrastructure.'
    },
    {
      label: 'Media Inquiry on August Launch Date',
      type: 'media_launch',
      text: 'Journalist asking whether the August 2026 Grand Opening is on schedule or delayed.'
    }
  ];

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const res = await fetch('/api/gemini/generate-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          commentType,
          rumorContext: 'Aviyana Ceylon Resort Sri Lanka, Launch August 2026, Central Environmental Authority EIA Approved'
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate PR response');
      }

      setResponse(data.data);
    } catch (err: any) {
      console.error('Gemini Assistant Error:', err);
      setError(err.message || 'An error occurred while contacting Gemini AI');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div id="gemini-ai-root" className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 space-y-6 pb-20">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-950/50 via-slate-900 to-amber-950/50 border border-amber-500/30 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40">
            <Bot size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-serif font-bold text-white flex items-center gap-2">
              Gemini PR Luxury Response Builder
              <span className="text-xs font-sans font-normal px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                gemini-3.6-flash
              </span>
            </h1>
            <p className="text-xs text-amber-200/80">
              Drafting calm, polite, Ceylon luxury PR responses for social media, GMB reviews, and forum inquiries.
            </p>
          </div>
        </div>

        <div className="mt-4 p-3 rounded-xl bg-slate-950/70 border border-amber-500/20 flex items-center space-x-3 text-xs text-slate-300">
          <Award size={20} className="text-amber-400 shrink-0" />
          <div>
            <strong className="text-amber-300">Core Principle:</strong> "Unwavering Excellence, Total Transparency & Authentic Hospitality — Elevating Sri Lanka's Ceylon Benchmark to the World."
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Preset Templates & Query Input */}
        <div className="space-y-4">
          <div className="bg-slate-900 border border-amber-500/20 rounded-2xl p-5">
            <h3 className="font-serif font-bold text-sm text-white mb-3 flex items-center gap-2">
              <Sparkles size={16} className="text-amber-400" />
              <span>Select PR Presets:</span>
            </h3>

            <div className="space-y-2">
              {presets.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQuery(p.text);
                    setCommentType(p.type);
                  }}
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/40 text-left transition-all text-xs text-slate-200 hover:text-amber-300"
                >
                  <div className="font-semibold text-amber-400 mb-0.5">{p.label}</div>
                  <p className="line-clamp-2 text-[11px] text-slate-400">{p.text}</p>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleGenerate} className="bg-slate-900 border border-amber-500/20 rounded-2xl p-5 space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Enter Comment / Rumor / Inquiry Text:
              </label>
              <textarea
                rows={5}
                placeholder="Paste negative review, social comment, or rumor thread here..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-slate-950 border border-amber-500/30 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Comment Classification Type:
              </label>
              <select
                value={commentType}
                onChange={(e) => setCommentType(e.target.value)}
                className="w-full bg-slate-950 border border-amber-500/30 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
              >
                <option value="social_rumor">Social Media Rumor / Forum Post</option>
                <option value="gmb_review">Google My Business Review</option>
                <option value="media_query">Media / Journalist Inquiry</option>
                <option value="community_faq">Community Infrastructure Question</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="animate-spin text-slate-950" />
                  <span>Drafting Luxury Ceylon Response...</span>
                </>
              ) : (
                <>
                  <Bot size={16} />
                  <span>Generate Polite Luxury PR Response</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: AI Output Display */}
        <div className="lg:col-span-2 space-y-4">
          
          {error && (
            <div className="p-4 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-center space-x-2">
              <AlertCircle size={18} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!response && !loading && !error && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
              <Bot size={48} className="mx-auto mb-3 text-slate-700" />
              <h4 className="text-base font-serif font-bold text-slate-400">Gemini PR Assistant Ready</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Select a preset or enter a comment on the left to generate an authentic, dignified response for Aviyana Ceylon Resort.
              </p>
            </div>
          )}

          {loading && (
            <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-12 text-center text-amber-300">
              <RefreshCw size={40} className="animate-spin mx-auto mb-4 text-amber-400" />
              <h4 className="text-base font-serif font-bold">Consulting Aviyana PR Playbook & CEA Clearances...</h4>
              <p className="text-xs text-slate-400 mt-1">Applying Ceylon Hospitality Tone & Suppressive SEO Principles</p>
            </div>
          )}

          {response && (
            <div className="space-y-4">
              
              {/* Primary English PR Response Card */}
              <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-6 shadow-xl space-y-4 relative">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-2">
                    <Globe size={18} className="text-amber-400" />
                    <h3 className="font-serif font-bold text-base text-white">Drafted Official Response (English)</h3>
                  </div>

                  <button
                    onClick={() => handleCopy(response.draftResponse)}
                    className="px-3 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500 hover:text-slate-950 text-xs font-bold transition-all flex items-center space-x-1.5"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copied ? 'Copied!' : 'Copy Response'}</span>
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-serif text-sm sm:text-base text-slate-100 leading-relaxed whitespace-pre-line">
                  {response.draftResponse}
                </div>

                {response.toneRating && (
                  <div className="text-xs text-amber-400 font-mono flex items-center space-x-2">
                    <Award size={14} />
                    <span>Tone Check: <strong>{response.toneRating}</strong></span>
                  </div>
                )}
              </div>

              {/* Sinhala Translation Card */}
              {response.sinhalaTranslation && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
                  <div className="flex items-center space-x-2 text-xs font-bold text-amber-300">
                    <MessageSquare size={16} />
                    <span>Polite Sinhala Translation:</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 text-xs text-slate-200 leading-relaxed font-sans">
                    {response.sinhalaTranslation}
                  </div>
                </div>
              )}

              {/* Tactical Action Recommendations */}
              {response.suggestedActions && (
                <div className="bg-slate-900 border border-amber-500/20 rounded-2xl p-5 space-y-2">
                  <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText size={14} />
                    <span>Tactical Operational Steps for Social Manager:</span>
                  </h4>
                  <ul className="space-y-1 text-xs text-slate-300">
                    {response.suggestedActions.map((act: string, idx: number) => (
                      <li key={idx} className="flex items-center space-x-2">
                        <span className="text-emerald-400 font-bold">✓</span>
                        <span>{act}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Verified Key Facts Used */}
              {response.keyFactsIncluded && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                    Verified Documents & Facts Cited:
                  </h4>
                  <ul className="space-y-1 text-xs text-slate-400 font-mono">
                    {response.keyFactsIncluded.map((fact: string, idx: number) => (
                      <li key={idx} className="flex items-center space-x-2">
                        <span className="text-amber-400">•</span>
                        <span>{fact}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            </div>
          )}

        </div>

      </div>

    </div>
  );
};
