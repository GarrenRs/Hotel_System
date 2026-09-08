'use client';

import React from 'react';
import { useLanguage } from '@/components/providers/LanguageContext';
import { Globe } from 'lucide-react';

export const LanguageSwitcher: React.FC = () => {
  const { locale, setLocale } = useLanguage();

  const toggleLanguage = () => {
    setLocale(locale === 'ar' ? 'fr' : 'ar');
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#B99246]/30 text-xs font-semibold uppercase tracking-wider text-white hover:border-[#B99246] hover:bg-[#B99246]/10 transition-all cursor-pointer"
      aria-label="Switch Language"
    >
      <Globe className="w-3.5 h-3.5 text-[#B99246]" />
      <span>{locale === 'ar' ? 'FR' : 'AR'}</span>
    </button>
  );
};
