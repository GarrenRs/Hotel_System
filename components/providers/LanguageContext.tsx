'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import arCommon from '@/messages/ar/common.json';
import arHome from '@/messages/ar/home.json';
import arRooms from '@/messages/ar/rooms.json';
import arContact from '@/messages/ar/contact.json';
import arAdmin from '@/messages/ar/admin.json';
import arValidation from '@/messages/ar/validation.json';
import arErrors from '@/messages/ar/errors.json';

import frCommon from '@/messages/fr/common.json';
import frHome from '@/messages/fr/home.json';
import frRooms from '@/messages/fr/rooms.json';
import frContact from '@/messages/fr/contact.json';
import frAdmin from '@/messages/fr/admin.json';
import frValidation from '@/messages/fr/validation.json';
import frErrors from '@/messages/fr/errors.json';

export type Locale = 'ar' | 'fr';

const messagesMap: Record<Locale, unknown> = {
  ar: {
    common: arCommon,
    home: arHome,
    rooms: arRooms,
    contact: arContact,
    admin: arAdmin,
    validation: arValidation,
    errors: arErrors,
  },
  fr: {
    common: frCommon,
    home: frHome,
    rooms: frRooms,
    contact: frContact,
    admin: frAdmin,
    validation: frValidation,
    errors: frErrors,
  },
};

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  dir: 'rtl' | 'ltr';
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>('ar');

  useEffect(() => {
    const saved = localStorage.getItem('hotel_hb_locale') as Locale;
    if (saved === 'ar' || saved === 'fr') {
      setTimeout(() => setLocaleState(saved), 0);
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('hotel_hb_locale', newLocale);
  };

  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = locale;
  }, [locale, dir]);

  const t = (keyPath: string): string => {
    const parts = keyPath.split('.');
    let current: unknown = messagesMap[locale];

    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = (current as Record<string, unknown>)[part];
      } else {
        return keyPath;
      }
    }

    return typeof current === 'string' ? current : keyPath;
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, dir, t }}>
      <div dir={dir} className={locale === 'ar' ? 'font-cairo' : 'font-poppins'}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
