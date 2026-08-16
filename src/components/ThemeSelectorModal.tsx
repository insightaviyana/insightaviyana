import React from 'react';
import { X, Palette, Check, Sparkles, Sun, Moon } from 'lucide-react';
import { AppTheme } from '../types';

interface ThemeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: AppTheme;
  onSelectTheme: (theme: AppTheme) => void;
}

export const ThemeSelectorModal: React.FC<ThemeSelectorModalProps> = ({
  isOpen,
  onClose,
  currentTheme,
  onSelectTheme,
}) => {
  if (!isOpen) return null;

  const themes: {
    id: AppTheme;
    name: string;
    tagline: string;
    description: string;
    icon: React.ElementType;
    previewBg: string;
    previewCard: string;
    previewBorder: string;
    previewAccent: string;
    previewText: string;
  }[] = [
    {
      id: 'dark',
      name: 'Dark',
      tagline: 'Classic Ceylon Dark Executive Theme',
      description: 'Deep midnight canvas with warm gold accents, rich contrast, and Ceylon resort prestige.',
      icon: Moon,
      previewBg: 'bg-slate-950',
      previewCard: 'bg-slate-900',
      previewBorder: 'border-amber-500/40',
      previewAccent: 'text-amber-400',
      previewText: 'text-slate-100',
    },
    {
      id: 'light',
      name: 'Light',
      tagline: 'Bright, Comfortable Daytime Theme',
      description: 'Clean white canvas with soft, high-contrast text and gold highlights, tuned for easy reading in bright environments.',
      icon: Sun,
      previewBg: 'bg-stone-100',
      previewCard: 'bg-white',
      previewBorder: 'border-amber-400/50',
      previewAccent: 'text-amber-600',
      previewText: 'text-stone-900',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-amber-500/40 rounded-3xl max-w-xl w-full p-6 text-slate-100 shadow-2xl relative my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-amber-500/20 pb-4 mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-amber-500/20 border border-amber-500/40 rounded-2xl text-amber-400">
              <Palette size={22} />
            </div>
            <div>
              <h2 className="text-xl font-serif font-bold text-white flex items-center gap-2">
                Display Theme
                <Sparkles size={16} className="text-amber-400" />
              </h2>
              <p className="text-xs text-slate-400">
                Choose Dark or Light for Aviyana Ceylon Resort ORM Portal
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Theme Options Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {themes.map((t) => {
            const isSelected = currentTheme === t.id;
            const Icon = t.icon;

            return (
              <div
                key={t.id}
                onClick={() => {
                  onSelectTheme(t.id);
                  onClose();
                }}
                className={`group relative p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-amber-400 bg-amber-500/10 shadow-lg shadow-amber-500/10 ring-2 ring-amber-400/50'
                    : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-800/40'
                }`}
              >
                {/* Selected Badge */}
                {isSelected && (
                  <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-bold text-[10px] flex items-center space-x-1 shadow-md">
                    <Check size={12} />
                    <span>Active</span>
                  </div>
                )}

                <div>
                  {/* Theme Header */}
                  <div className="flex items-center space-x-2.5 mb-2">
                    <div className={`p-2 rounded-xl ${t.previewBg} ${t.previewBorder} border`}>
                      <Icon size={18} className={t.previewAccent} />
                    </div>
                    <div>
                      <h3 className="font-serif font-bold text-sm text-white">{t.name}</h3>
                      <p className="text-[10px] text-amber-300 font-medium">{t.tagline}</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                    {t.description}
                  </p>
                </div>

                {/* Mini Visual Preview Box */}
                <div className={`mt-4 p-2.5 rounded-xl ${t.previewBg} border ${t.previewBorder} space-y-1.5`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold ${t.previewAccent}`}>Aviyana Ceylon</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">Verified</span>
                  </div>
                  <div className={`p-2 rounded-lg ${t.previewCard} border ${t.previewBorder} text-[10px] ${t.previewText}`}>
                    100% CEA Cleared & Official News Portal
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Theme choice is saved for your session.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl transition-colors"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
