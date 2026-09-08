'use client';

import React from 'react';
import { GalleryGrid } from '@/components/hotel/GalleryGrid';
import { useLanguage } from '@/components/providers/LanguageContext';

export default function GalleryPage() {
  const { t } = useLanguage();

  return (
    <div className="pt-32 pb-24 space-y-12">
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
        <span className="text-xs font-bold text-[#B99246] uppercase tracking-widest">
          {t('common.gallery.subtitle')}
        </span>
        <h1 className="text-4xl sm:text-5xl font-bold text-[#111111]">
          {t('common.nav.gallery')} - {t('common.hotelName')}
        </h1>
        <p className="text-sm text-[#333333]/80 max-w-2xl mx-auto">
          {t('common.galleryDesc')}
        </p>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <GalleryGrid />
      </section>
    </div>
  );
}
