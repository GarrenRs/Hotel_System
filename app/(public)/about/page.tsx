'use client';

import React from 'react';
import Image from 'next/image';
import { useLanguage } from '@/components/providers/LanguageContext';
import { HOTEL } from '@/config/hotel';
import { Star, ShieldCheck, Award, HeartHandshake } from 'lucide-react';

export default function AboutPage() {
  const { t } = useLanguage();

  return (
    <div className="pt-32 pb-24 space-y-16">
      {/* Header Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
        <span className="text-xs font-bold text-[#B99246] uppercase tracking-widest">
          {t('common.stars')}
        </span>
        <h1 className="text-4xl sm:text-5xl font-bold text-[#111111]">
          {t('common.nav.about')} - {t('common.hotelName')}
        </h1>
        <p className="text-sm text-[#333333]/80 max-w-2xl mx-auto">
          {t('common.tagline')}
        </p>
      </section>

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#111111]">
            {t('home.aboutShort.title')}
          </h2>
          <p className="text-sm text-[#333333]/80 leading-relaxed">
            {t('home.aboutShort.description')}
          </p>
          <p className="text-sm text-[#333333]/80 leading-relaxed">
            {t('home.aboutLongDesc')}
          </p>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="p-4 rounded-2xl bg-white border border-[#CBC4B6] shadow-luxury flex items-center gap-3">
              <Award className="w-6 h-6 text-[#B99246]" />
              <div>
                <h4 className="font-bold text-xs">{t('home.features.luxuryTitle')}</h4>
                <p className="text-[11px] text-[#333333]/70">{t('home.features.luxurySub')}</p>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-[#CBC4B6] shadow-luxury flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-[#B99246]" />
              <div>
                <h4 className="font-bold text-xs">{t('home.features.securityTitle')}</h4>
                <p className="text-[11px] text-[#333333]/70">{t('home.features.securitySub')}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative h-96 rounded-3xl overflow-hidden border border-[#CBC4B6] shadow-luxury bg-[#111111]">
          <Image
            src="/images/hero/hotel-lobby.webp"
            alt={`About ${HOTEL.name}`}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover opacity-80"
          />
        </div>
      </section>
    </div>
  );
}
