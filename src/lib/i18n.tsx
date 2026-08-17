import React, { createContext, useContext, useState, ReactNode } from 'react';

/**
 * Multi-language support — longer-term item from ENGINEERING_ASSESSMENT.md
 * ("only if international press coverage specifically warrants it").
 *
 * Deliberately a small hand-rolled i18n layer (no react-i18next or similar)
 * rather than a full framework: this app's translation surface is bounded
 * — navigation, hero copy, and section headers — not the hundreds of
 * strings a typical i18n setup handles, because the bulk of the site's
 * actual content (articles, milestones, fact-checks) is free text an
 * admin/staff member writes per-post, not a fixed UI string a translation
 * file can cover. Auto-translating that free text would need a live
 * translation API (cost, latency, and — for anything published as an
 * official press statement — real editorial review before anything
 * machine-translated goes out under the resort's name), so it's
 * deliberately out of scope here. What this DOES cover: every
 * static/structural UI string (nav labels, hero copy, section headers,
 * buttons) is translatable, and adding a new language is just adding a new
 * entry to TRANSLATIONS below — no plumbing changes needed elsewhere.
 *
 * Ships with English and Sinhala (the official/majority language where the
 * resort operates — serves local press and community, not just
 * international coverage). Adding Tamil (Sri Lanka's other official
 * language) is the natural next addition — same shape, new dictionary
 * entry.
 */

export type Language = 'en' | 'si';

export const LANGUAGE_LABELS: Record<Language, string> = {
  en: 'English',
  si: 'සිංහල',
};

export interface TranslationDict {
  nav: {
    publicHub: string;
    factCheckPortal: string;
    announcements: string;
    education: string;
    careers: string;
    investment: string;
    pressKit: string;
  };
  hero: {
    tagline: string;
    subtitle: string;
    askQuestion: string;
    verifyClaim: string;
  };
  factCheck: {
    badge: string;
    title: string;
    description: string;
    searchPlaceholder: string;
    signatureBadge: string;
  };
  pressKit: {
    badge: string;
    title: string;
    subtitle: string;
    pressContact: string;
    rssFeed: string;
  };
  common: {
    pressContact: string;
    skipToContent: string;
  };
}

const en: TranslationDict = {
  nav: {
    publicHub: 'Public Hub',
    factCheckPortal: 'Fact-Check Portal',
    announcements: 'Announcements',
    education: 'Aviyana Global Campus',
    careers: 'Careers',
    investment: 'Investment',
    pressKit: 'Press Kit',
  },
  hero: {
    tagline: 'Online Reputation Management & Verified Source of Truth',
    subtitle: 'Authentic news, luxury fleet updates, and milestone progress towards our August 2027 Strategic Grand Opening.',
    askQuestion: 'Submit Direct Question',
    verifyClaim: 'Verify a Claim — Fact-Check Portal',
  },
  factCheck: {
    badge: 'Fact-Check Portal',
    title: 'Fact-Check & Myth vs. Reality FAQ',
    description: 'Every rumor addressed with a document-backed official answer — this is the standing, publicly-verifiable rebuttal archive most resort newsrooms don\u2019t offer.',
    searchPlaceholder: 'Search rumors or topics...',
    signatureBadge: 'Signature Feature',
  },
  pressKit: {
    badge: 'Official Press Kit',
    title: 'Aviyana Insight — Press Kit',
    subtitle: 'Everything a journalist needs in one place: logos, executive headshots, boilerplate copy, and a curated photo library.',
    pressContact: 'Press Contact',
    rssFeed: 'RSS Feed',
  },
  common: {
    pressContact: 'Press Contact',
    skipToContent: 'Skip to main content',
  },
};

const si: TranslationDict = {
  nav: {
    publicHub: 'මහජන කේන්ද්‍රය',
    factCheckPortal: 'කරුණු සත්‍යාපන ද්වාරය',
    announcements: 'නිවේදන',
    education: 'අවියානා ග්ලෝබල් කැම්පස්',
    careers: 'රැකියා අවස්ථා',
    investment: 'ආයෝජන',
    pressKit: 'මාධ්‍ය කට්ටලය',
  },
  hero: {
    tagline: 'මාර්ගගත කීර්ති කළමනාකරණය සහ සත්‍ය මූලාශ්‍රය',
    subtitle: '2027 අගෝස්තු මහා විවෘත කිරීම වෙත ගමන් කරන අතරතුර සත්‍ය පුවත්, සුඛෝපභෝගී වාහන යාත්‍රා යාවත්කාලීන කිරීම් සහ සන්ධිස්ථාන ප්‍රගතිය.',
    askQuestion: 'ප්‍රශ්නයක් යොමු කරන්න',
    verifyClaim: 'ප්‍රකාශයක් තහවුරු කරන්න — කරුණු සත්‍යාපන ද්වාරය',
  },
  factCheck: {
    badge: 'කරුණු සත්‍යාපන ද්වාරය',
    title: 'කරුණු සත්‍යාපනය සහ මිථ්‍යාව එදිරිව යථාර්ථය',
    description: 'සෑම කටකථාවකටම ලේඛන මගින් සනාථ කරන ලද නිල පිළිතුරක් — බොහෝ රජාවතුරු මාධ්‍ය මධ්‍යස්ථාන ලබා නොදෙන, ස්ථිර හා ප්‍රසිද්ධියේ සත්‍යාපනය කළ හැකි ප්‍රතිචාර ලේඛනාගාරයකි.',
    searchPlaceholder: 'කටකථා හෝ මාතෘකා සොයන්න...',
    signatureBadge: 'විශේෂාංග අංගය',
  },
  pressKit: {
    badge: 'නිල මාධ්‍ය කට්ටලය',
    title: 'අවියානා ඉන්සයිට් — මාධ්‍ය කට්ටලය',
    subtitle: 'මාධ්‍යවේදියෙකුට අවශ්‍ය සියල්ල එකම තැනක: ලාංඡන, විධායක ඡායාරූප, සම්මත පෙළ, සහ තෝරාගත් ඡායාරූප එකතුව.',
    pressContact: 'මාධ්‍ය සම්බන්ධතාව',
    rssFeed: 'RSS සංග්‍රහය',
  },
  common: {
    pressContact: 'මාධ්‍ය සම්බන්ධතාව',
    skipToContent: 'ප්‍රධාන අන්තර්ගතයට යන්න',
  },
};

export const TRANSLATIONS: Record<Language, TranslationDict> = { en, si };

const LANGUAGE_STORAGE_KEY = 'aviyana-insight-language';

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationDict;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

function getInitialLanguage(): Language {
  try {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored === 'en' || stored === 'si') return stored;
  } catch {
    // localStorage unavailable (private browsing, etc.) -- fall through to default.
  }
  return 'en';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch {
      // Best-effort persistence only -- the language still applies for this session either way.
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: TRANSLATIONS[language] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider');
  return ctx;
}
