'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/components/providers/LanguageContext';
import { Users, Maximize, Calendar } from 'lucide-react';

interface RoomCardProps {
  roomKey: string;
  image: string;
  priceDZD: number;
  area: string;
  capacity: number;
}

export const RoomCard: React.FC<RoomCardProps> = ({
  roomKey,
  image,
  priceDZD,
  area,
  capacity,
}) => {
  const { t } = useLanguage();

  return (
    <div className="bg-white rounded-3xl overflow-hidden border border-[#CBC4B6] shadow-luxury shadow-luxury-hover flex flex-col group">
      {/* Image Container */}
      <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-[#111111]">
        <Image
          src={image}
          alt={t(`rooms.${roomKey}.title`)}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#111111]/80 via-transparent to-transparent" />
        <div className="absolute top-4 right-4 bg-[#111111]/80 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold text-[#B99246] border border-[#B99246]/30">
          {priceDZD.toLocaleString()} {t('rooms.perNight')}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between space-y-6">
        <div className="space-y-3">
          <h3 className="text-xl font-bold text-[#111111] group-hover:text-[#B99246] transition-colors">
            {t(`rooms.${roomKey}.title`)}
          </h3>
          <p className="text-xs text-[#333333]/80 leading-relaxed">
            {t(`rooms.${roomKey}.description`)}
          </p>
        </div>

        {/* Room Attributes */}
        <div className="flex items-center gap-6 pt-4 border-t border-[#CBC4B6] text-xs text-[#333333]/70 font-medium">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#B99246]" />
            <span>{capacity} {t('rooms.persons')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Maximize className="w-4 h-4 text-[#B99246]" />
            <span>{area}</span>
          </div>
        </div>

        {/* Reserve Button */}
        <Link
          href={`/contact?room=${roomKey}#booking`}
          className="w-full py-3.5 rounded-2xl bg-[#111111] text-[#B99246] font-bold text-xs uppercase tracking-wider text-center hover:bg-[#B99246] hover:text-[#111111] transition-all flex items-center justify-center gap-2 group-hover:shadow-lg"
        >
          <Calendar className="w-4 h-4" />
          <span>{t('rooms.reserveRoom')}</span>
        </Link>
      </div>
    </div>
  );
};
