'use client';

import React from 'react';
import Image from 'next/image';
import { useLanguage } from '@/components/providers/LanguageContext';
import { HOTEL } from '@/config/hotel';

export default function WeddingPage() {
  const { t } = useLanguage();

  return (
    <div className="pt-32 pb-24 space-y-16">
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
        <span className="text-xs font-bold text-[#B99246] uppercase tracking-widest">
          {t('common.services.weddingSubtitle')}
        </span>
        <h1 className="text-4xl sm:text-5xl font-bold text-[#111111]">
          {t('common.nav.wedding')} - {t('common.hotelName')}
        </h1>
        <p className="text-sm text-[#333333]/80 max-w-2xl mx-auto">
          {t('home.amenities.wedding')}
        </p>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#111111]">
            {t('home.amenitiesLong.weddingTitle')}
          </h2>
          <p className="text-sm text-[#333333]/80 leading-relaxed">
            {t('home.amenitiesLong.weddingDesc')}
          </p>
        </div>
        <div className="relative h-96 rounded-3xl overflow-hidden border border-[#EAEAEA] shadow-luxury bg-[#111111]">
          <Image
            src="/images/events/hotel-ballroom.webp"
            alt={`${HOTEL.name} Wedding Hall`}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
      </section>
    </div>
  );
}
