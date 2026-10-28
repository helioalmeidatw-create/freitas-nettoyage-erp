import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../i18n/translations';
import type { Language } from '../i18n/translations';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations.pt) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('cleanpro_lang');
    return (saved === 'fr' || saved === 'en' || saved === 'pt') ? saved : 'pt';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('cleanpro_lang', lang);
  };

  const t = (key: keyof typeof translations.pt): string => {
    const dict = translations[language] || translations.pt;
    return dict[key] || translations.pt[key] || String(key);
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used within an I18nProvider');
  return context;
};
