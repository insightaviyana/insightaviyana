import React from 'react';
import { Facebook, Instagram, Linkedin, Youtube, Globe, Twitter, MessageCircle, Share2 } from 'lucide-react';
import { SocialLink } from '../types';

interface SocialLinksBarProps {
  socialLinks: SocialLink[];
  compact?: boolean;
}

const ICON_MAP: Record<SocialLink['iconName'], React.ElementType> = {
  facebook: Facebook,
  instagram: Instagram,
  linkedin: Linkedin,
  youtube: Youtube,
  tiktok: Share2, // lucide has no dedicated TikTok glyph; Share2 as a reasonable stand-in
  whatsapp: MessageCircle,
  globe: Globe,
  twitter: Twitter
};

export const SocialLinksBar: React.FC<SocialLinksBarProps> = ({ socialLinks, compact = false }) => {
  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        {socialLinks.map((link) => {
          const Icon = ICON_MAP[link.iconName] || Globe;
          return (
            <a
              key={link.platform}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 flex items-center justify-center bg-slate-900 hover:bg-amber-500 text-slate-300 hover:text-slate-950 border border-slate-800 hover:border-amber-400 rounded-full transition-all"
              title={`${link.platform} — ${link.handle}`}
            >
              <Icon size={15} />
            </a>
          );
        })}
      </div>
    );
  }

  // Compact icon row instead of one large text-heavy card per platform --
  // real brand icons, platform name + handle shown small, so the whole
  // section takes a fraction of the vertical space it used to.
  return (
    <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-5 shadow-xl">
      <div className="flex items-center space-x-2 mb-4">
        <Share2 size={18} className="text-amber-400" />
        <h3 className="font-serif font-bold text-base text-white">Official Aviyana Ceylon Channels</h3>
        <span className="ml-auto text-[9px] uppercase font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-500/30 font-bold">
          Verified
        </span>
      </div>

      <div className="flex flex-wrap gap-3">
        {socialLinks.map((link) => {
          const Icon = ICON_MAP[link.iconName] || Globe;
          return (
            <a
              key={link.platform}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2.5 px-3.5 py-2.5 bg-slate-950 hover:bg-amber-500/10 border border-slate-800 hover:border-amber-500/40 rounded-xl transition-all"
              title={link.description}
            >
              <div className="w-8 h-8 shrink-0 rounded-full bg-slate-900 group-hover:bg-amber-500 flex items-center justify-center transition-all">
                <Icon size={15} className="text-amber-400 group-hover:text-slate-950" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">{link.platform}</div>
                <div className="text-[10px] font-mono text-slate-400 truncate max-w-[140px]">{link.handle}</div>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
};
