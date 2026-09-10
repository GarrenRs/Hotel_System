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

  const statItems = [
    {
      label: t('home.stats.rooms'),
      value: roomCount !== null ? `${roomCount}+` : '...',
    },
    { label: t('home.stats.guests'), value: '12,000+' },
    { label: t('home.stats.satisfaction'), value: '99%' },
    { label: t('home.stats.experience'), value: '10+' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10 text-center">
        {statItems.map((stat) => (
          <div key={stat.label} className="min-w-0 flex flex-col items-center">
            <div className="text-4xl sm:text-5xl font-bold text-[#B99246] leading-none whitespace-nowrap">
              {stat.value}
            </div>
            <div className="mt-2 text-xs text-white/70 uppercase tracking-wider leading-5">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};