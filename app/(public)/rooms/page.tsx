'use client';

import React from 'react';
import { RoomCard } from '@/components/hotel/RoomCard';
import { useLanguage } from '@/components/providers/LanguageContext';
import { ROOM_TYPES_LIST } from '@/lib/constants';

export default function RoomsPage() {
  const { t } = useLanguage();

  return (
    <div className="pt-32 pb-24 space-y-16">
      {/* Header Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
        <span className="text-xs font-bold text-[#B99246] uppercase tracking-widest">
          {t('rooms.subtitle')}
        </span>
        <h1 className="text-4xl sm:text-5xl font-bold text-[#111111]">
          {t('rooms.title')}
        </h1>
        <p className="text-sm text-[#333333]/80 max-w-2xl mx-auto">
          {t('rooms.roomsDesc')}
        </p>
      </section>

      {/* Rooms Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {ROOM_TYPES_LIST.map((room) => (
            <RoomCard
              key={room.id}
              roomKey={room.key}
              image={room.image}
              priceDZD={room.priceDZD}
              area={room.area}
              capacity={room.capacity}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
