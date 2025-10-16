import { useState, useEffect } from 'react';
import en from '../i18n/en.json';
import wo from '../i18n/wo.json';

const languages = { en, wo };

export const useTranslation = () => {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('lang') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('lang', lang);
  }, [lang]);

  const t = (key) => {
    const keys = key.split('.');
    let value = languages[lang];

    for (const k of keys) {
      value = value?.[k];
    }

    return value || key;
  };

  const toggleLang = () => {
    setLang(prev => prev === 'en' ? 'wo' : 'en');
  };

  return { t, lang, toggleLang };
};
