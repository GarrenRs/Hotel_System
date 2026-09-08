'use client';

import React from 'react';
import { ReservationStatus } from '@/domain/reservation/enums';
import { useLanguage } from '@/components/providers/LanguageContext';

interface StatusBadgeProps {
  status: ReservationStatus | string;
}

const statusStyles: Record<string, { bg: string; dot: string }> = {
  [ReservationStatus.NEW]: {
    bg: 'bg-blue-500/10 text-blue-600 border-blue-200',
    dot: '🔵',
  },
  [ReservationStatus.PENDING]: {
    bg: 'bg-amber-500/10 text-amber-600 border-amber-200',
    dot: '🟡',
  },
  [ReservationStatus.CONFIRMED]: {
    bg: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
    dot: '🟢',
  },
  [ReservationStatus.CANCELLED]: {
    bg: 'bg-rose-500/10 text-rose-600 border-rose-200',
    dot: '🔴',
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const { t } = useLanguage();
  const normalizedStatus = status as ReservationStatus;
  const style = statusStyles[normalizedStatus] || statusStyles[ReservationStatus.NEW];

  const statusTranslationKeyMap: Record<string, string> = {
    [ReservationStatus.NEW]: 'common.status.new',
    [ReservationStatus.PENDING]: 'common.status.pending',
    [ReservationStatus.CONFIRMED]: 'common.status.confirmed',
    [ReservationStatus.CANCELLED]: 'common.status.cancelled',
  };

  const key = statusTranslationKeyMap[normalizedStatus] || 'common.status.new';
  const label = t(key);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${style.bg}`}
    >
      <span className="text-[10px]">{style.dot}</span>
      <span>{label}</span>
    </span>
  );
};
