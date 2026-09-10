'use client';

import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/components/providers/LanguageContext';

/**
 * Home statistics band. The room count is read live from GET /api/rooms so the
 * public page never displays a hardcoded figure that disagrees with the real
 * inventory (ST-002). The remaining stats are static marketing numbers.
 */
export const StatsBand: React.FC = () => {
  const { t } = useLanguage();
  const [roomCount, setRoomCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch('/api/rooms');
        const result = await res.json();
        if (!cancelled && result.success) {
          setRoomCount(result.data.length);
        }
      } catch (err) {
        console.error(err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
      <div className="space-y-2">
        <div className="text-4xl sm:text-5xl font-bold text-[#B99246]">
          {roomCount !== null ? `${roomCount}+` : '...'}
        </div>
        <div className="text-xs text-white/70 uppercase tracking-wider">{t('home.stats.rooms')}</div>
      </div>
      <div className="space-y-2">
        <div className="text-4xl sm:text-5xl font-bold text-[#B99246]">12,000+</div>
        <div className="text-xs text-white/70 uppercase tracking-wider">{t('home.stats.guests')}</div>
      </div>
      <div className="space-y-2">
        <div className="text-4xl sm:text-5xl font-bold text-[#B99246]">99%</div>
        <div className="text-xs text-white/70 uppercase tracking-wider">{t('home.stats.satisfaction')}</div>
      </div>
      <div className="space-y-2">
        <div className="text-4xl sm:text-5xl font-bold text-[#B99246]">10+</div>
        <div className="text-xs text-white/70 uppercase tracking-wider">{t('home.stats.experience')}</div>
      </div>
    </div>
  );
};