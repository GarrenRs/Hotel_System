'use client';

import React from 'react';
import Image from 'next/image';
import { useLanguage } from '@/components/providers/LanguageContext';
import { HOTEL } from '@/config/hotel';
import { Utensils, Coffee, Wine, Sparkles } from 'lucide-react';

export default function RestaurantPage() {
  const { t } = useLanguage();

  return (
    <div className="pt-32 pb-24 space-y-16">
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
        <span className="text-xs font-bold text-[#B99246] uppercase tracking-widest">
          {t('common.services.restaurantSubtitle')}
        </span>
        <h1 className="text-4xl sm:text-5xl font-bold text-[#111111]">
          {t('common.nav.restaurant')} - {t('common.hotelName')}
        </h1>
        <p className="text-sm text-[#333333]/80 max-w-2xl mx-auto">
          {t('home.amenities.restaurant')}
        </p>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="relative h-96 rounded-3xl overflow-hidden border border-[#EAEAEA] shadow-luxury bg-[#111111]">
          <Image
            src="/images/restaurant/hotel-restaurant-main.webp"
            alt={`${HOTEL.name} Restaurant`}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
        <div className="space-y-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#111111]">
            {t('home.amenitiesLong.restaurantTitle')}
          </h2>
          <p className="text-sm text-[#333333]/80 leading-relaxed">
            {t('home.amenitiesLong.restaurantDesc')}
          </p>
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3 text-xs font-semibold text-[#111111]">
              <Coffee className="w-4 h-4 text-[#B99246]" />
              <span>{t('home.amenitiesLong.breakfastDesc')}</span>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold text-[#111111]">
              <Utensils className="w-4 h-4 text-[#B99246]" />
              <span>{t('home.amenitiesLong.lunchDinnerDesc')}</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
