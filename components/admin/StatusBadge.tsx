'use client';

import React from 'react';
import { useLanguage } from '@/components/providers/LanguageContext';
import { reservationStatusUi, roomStatusUi } from '@/lib/status';

interface StatusBadgeProps {
  status: string;
  kind?: 'reservation' | 'room';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, kind = 'reservation' }) => {
  const { t } = useLanguage();
  const ui = kind === 'room' ? roomStatusUi(status) : reservationStatusUi(status);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${ui.badgeBg}`}
    >
      <span className="text-[10px]">{ui.dot}</span>
      <span>{t(ui.labelKey)}</span>
    </span>
  );
};