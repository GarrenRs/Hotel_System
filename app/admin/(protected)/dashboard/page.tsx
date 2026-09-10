'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/components/providers/LanguageContext';
import { AdminStats } from '@/domain/reservation/types';
import { ReservationEntity } from '@/domain/reservation/entities';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { ROOM_TYPES_LIST } from '@/lib/constants';
import {
  Layers,
  Sparkles,
  DoorOpen,
  CheckCircle2,
  Wrench,
  CalendarCheck,
  CalendarPlus,
  CalendarX,
  Users,
  ArrowRight,
} from 'lucide-react';

const BOOT_RETRY_ATTEMPTS = 4;
const BOOT_RETRY_DELAY_MS = 1200;

type NumericAdminStat =
  | 'totalRooms'
  | 'availableRooms'
  | 'occupiedRooms'
  | 'cleaningRooms'
  | 'maintenanceRooms'
  | 'reservedUpcoming'
  | 'todayArrivals'
  | 'todayDepartures';

interface StatCard {
  key: NumericAdminStat;
  labelKey: string;
  icon: React.ReactNode;
  className: string;
  iconClassName: string;
}

const ROOM_STAT_CARDS: StatCard[] = [
  {
    key: 'totalRooms',
    labelKey: 'admin.stats.totalRooms',
    icon: <Layers className="w-5 h-5" />,
    className: 'bg-white border-[#CBC4B6]',
    iconClassName: 'text-[#B99246]',
  },
  {
    key: 'availableRooms',
    labelKey: 'admin.stats.availableRooms',
    icon: <CheckCircle2 className="w-5 h-5" />,
    className: 'bg-emerald-50/50 border-emerald-200',
    iconClassName: 'text-emerald-600',
  },
  {
    key: 'occupiedRooms',
    labelKey: 'admin.stats.occupiedRooms',
    icon: <DoorOpen className="w-5 h-5" />,
    className: 'bg-blue-50/50 border-blue-200',
    iconClassName: 'text-blue-600',
  },
  {
    key: 'cleaningRooms',
    labelKey: 'admin.stats.cleaningRooms',
    icon: <Sparkles className="w-5 h-5" />,
    className: 'bg-amber-50/50 border-amber-200',
    iconClassName: 'text-amber-600',
  },
  {
    key: 'maintenanceRooms',
    labelKey: 'admin.stats.maintenanceRooms',
    icon: <Wrench className="w-5 h-5" />,
    className: 'bg-rose-50/50 border-rose-200',
    iconClassName: 'text-rose-600',
  },
];

const RESERVATION_STAT_CARDS: StatCard[] = [
  {
    key: 'reservedUpcoming',
    labelKey: 'admin.stats.reservedUpcoming',
    icon: <CalendarCheck className="w-5 h-5" />,
    className: 'bg-white border-[#CBC4B6]',
    iconClassName: 'text-[#B99246]',
  },
  {
    key: 'todayArrivals',
    labelKey: 'admin.stats.todayArrivals',
    icon: <CalendarPlus className="w-5 h-5" />,
    className: 'bg-emerald-50/50 border-emerald-200',
    iconClassName: 'text-emerald-600',
  },
  {
    key: 'todayDepartures',
    labelKey: 'admin.stats.todayDepartures',
    icon: <CalendarX className="w-5 h-5" />,
    className: 'bg-amber-50/50 border-amber-200',
    iconClassName: 'text-amber-600',
  },
];

export default function AdminDashboardPage() {
  const { t } = useLanguage();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentReservations, setRecentReservations] = useState<ReservationEntity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchBoot(attempt: number): Promise<void> {
      try {
        const statsRes = await fetch('/api/admin/stats');
        const statsData = await statsRes.json();
        const listRes = await fetch('/api/reservations');
        const listData = await listRes.json();

        if (cancelled) return;

        let seeded = false;
        if (statsData.success && statsData.data) {
          setStats(statsData.data);
          seeded = true;
        }
        if (listData.success && listData.data.length > 0) {
          setRecentReservations(listData.data.slice(0, 5));
          seeded = true;
        }

        if (!seeded && attempt < BOOT_RETRY_ATTEMPTS) {
          setTimeout(() => fetchBoot(attempt + 1), BOOT_RETRY_DELAY_MS);
          return;
        }

        setLoading(false);
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          if (attempt < BOOT_RETRY_ATTEMPTS) {
            setTimeout(() => fetchBoot(attempt + 1), BOOT_RETRY_DELAY_MS);
          } else {
            setLoading(false);
          }
        }
      }
    }

    fetchBoot(0);

    return () => {
      cancelled = true;
    };
  }, []);

  const roomTypeTitle = (roomType: string): string => {
    const room = ROOM_TYPES_LIST.find((r) => r.id === roomType);
    return room ? t(`rooms.${room.key}.title`) : roomType;
  };

  const renderStatCards = (cards: StatCard[]) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-4">
      {cards.map((card) => (
        <div
          key={card.key}
          className={`p-6 rounded-3xl border shadow-luxury space-y-2 ${card.className}`}
        >
          <div className={`flex items-center justify-between ${card.iconClassName}`}>
            <span className="text-xs font-semibold">{t(card.labelKey)}</span>
            {card.icon}
          </div>
          <div className="text-3xl font-bold text-[#111111]">
            {loading ? '...' : stats?.[card.key] ?? 0}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#CBC4B6] pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111111]">
            {t('admin.dashboard')}
          </h1>
          <p className="text-xs text-[#333333]/70">
            {t('admin.dashboardSubtitle')}
          </p>
        </div>
        <Link
          href="/admin/reservations"
          className="px-5 py-2.5 rounded-full bg-[#B99246] text-[#111111] font-bold text-xs uppercase tracking-wider hover:bg-[#D4AF37] transition-all flex items-center gap-2"
        >
          <span>{t('admin.reservations')}</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Room Status (ST-001 §K) */}
      {renderStatCards(ROOM_STAT_CARDS)}

      {/* Reservation Flow (ST-001 §K) */}
      {renderStatCards(RESERVATION_STAT_CARDS)}

      {/* Current Guests (ST-001 §K) */}
      <div className="bg-white rounded-3xl border border-[#CBC4B6] shadow-luxury p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#B99246]" />
            <h2 className="text-lg font-bold text-[#111111]">
              {t('admin.stats.currentGuests')}
            </h2>
          </div>
        </div>

        {!loading && stats && stats.currentGuests.length === 0 ? (
          <p className="text-xs text-[#333333]/50">{t('admin.currentGuestsEmpty')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead>
                <tr className="border-b border-[#CBC4B6] text-[#333333]/60">
                  <th className="pb-3 px-3 font-semibold">{t('admin.table.guest')}</th>
                  <th className="pb-3 px-3 font-semibold">{t('admin.table.roomNumber')}</th>
                  <th className="pb-3 px-3 font-semibold">{t('admin.table.roomType')}</th>
                  <th className="pb-3 px-3 font-semibold">{t('admin.table.departure')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#CBC4B6]">
                {stats?.currentGuests.map((guest) => (
                  <tr key={guest.reservationId} className="hover:bg-[#FAF9F7]/80 transition-colors">
                    <td className="py-3.5 px-3 font-semibold">{guest.guestName}</td>
                    <td className="py-3.5 px-3 font-mono font-bold">{guest.roomNumber}</td>
                    <td className="py-3.5 px-3 text-[#333333]/80">{roomTypeTitle(guest.roomType)}</td>
                    <td className="py-3.5 px-3 text-[#333333]/80">{guest.departureDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Reservations Table Preview */}
      <div className="bg-white rounded-3xl border border-[#CBC4B6] shadow-luxury p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#111111]">
            {t('admin.recentReservationsTitle')}
          </h2>
          <Link
            href="/admin/reservations"
            className="text-xs font-bold text-[#B99246] hover:underline"
          >
            {t('admin.viewAll')}
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right">
            <thead>
              <tr className="border-b border-[#CBC4B6] text-[#333333]/60">
                <th className="pb-3 px-3 font-semibold">{t('admin.table.id')}</th>
                <th className="pb-3 px-3 font-semibold">{t('admin.table.customer')}</th>
                <th className="pb-3 px-3 font-semibold">{t('admin.table.roomNumber')}</th>
                <th className="pb-3 px-3 font-semibold">{t('admin.table.roomType')}</th>
                <th className="pb-3 px-3 font-semibold">{t('admin.table.status')}</th>
                <th className="pb-3 px-3 font-semibold">{t('admin.table.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#CBC4B6]">
              {recentReservations.map((res) => (
                <tr key={res.id} className="hover:bg-[#FAF9F7]/80 transition-colors">
                  <td className="py-3.5 px-3 font-mono font-bold text-[#111111]">
                    {res.reservationId}
                  </td>
                  <td className="py-3.5 px-3 font-semibold">{res.customerName}</td>
                  <td className="py-3.5 px-3 font-mono text-[#333333]/80">
                    {res.roomNumber ?? '—'}
                  </td>
                  <td className="py-3.5 px-3 text-[#333333]/80">
                    {roomTypeTitle(String(res.roomType))}
                  </td>
                  <td className="py-3.5 px-3">
                    <StatusBadge status={res.status} />
                  </td>
                  <td className="py-3.5 px-3">
                    <Link
                      href={`/admin/reservations/${res.id}`}
                      className="px-3 py-1 rounded-full bg-[#111111] text-[#B99246] text-[11px] font-semibold hover:bg-[#B99246] hover:text-[#111111] transition-all"
                    >
                      {t('admin.actions.view')}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}