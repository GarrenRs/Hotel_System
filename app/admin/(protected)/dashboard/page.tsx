'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/components/providers/LanguageContext';
import { ReservationStats } from '@/domain/reservation/types';
import { ReservationEntity } from '@/domain/reservation/entities';
import { RoomEntity } from '@/domain/room/entities';
import { RoomStatus } from '@/domain/room/enums';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { Sparkles, Clock, CheckCircle2, XCircle, ArrowRight, Layers, BedDouble } from 'lucide-react';
import { ROOM_TYPES_LIST } from '@/lib/constants';

const BOOT_RETRY_ATTEMPTS = 4;
const BOOT_RETRY_DELAY_MS = 1200;

export default function AdminDashboardPage() {
  const { t } = useLanguage();
  const [stats, setStats] = useState<ReservationStats | null>(null);
  const [recentReservations, setRecentReservations] = useState<ReservationEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState<RoomEntity[]>([]);
  const [roomsLoaded, setRoomsLoaded] = useState(false);

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
        if (statsData.success && (statsData.data?.total ?? 0) > 0) {
          setStats(statsData.data);
          seeded = true;
        }
        if (listData.success && listData.data.length > 0) {
          setRecentReservations(listData.data.slice(0, 5));
          seeded = true;
        }

        // Keep the loading states visible instead of flashing an empty page.
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

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch('/api/rooms');
        const result = await res.json();
        if (!cancelled && result.success) {
          setRooms(result.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) {
          setRoomsLoaded(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const occupiedRoomsCount = rooms.filter((r) => r.status === RoomStatus.OCCUPIED).length;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#EAEAEA] pb-6">
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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total */}
        <div className="p-6 rounded-3xl bg-white border border-[#EAEAEA] shadow-luxury space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">{t('admin.stats.total')}</span>
            <Layers className="w-5 h-5 text-[#B99246]" />
          </div>
          <div className="text-3xl font-bold text-[#111111]">
            {loading ? '...' : stats?.total || 0}
          </div>
        </div>

        {/* New */}
        <div className="p-6 rounded-3xl bg-blue-50/50 border border-blue-100 shadow-luxury space-y-2">
          <div className="flex items-center justify-between text-blue-600">
            <span className="text-xs font-semibold">{t('admin.stats.new')}</span>
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="text-3xl font-bold text-blue-700">
            {loading ? '...' : stats?.newCount || 0}
          </div>
        </div>

        {/* Pending */}
        <div className="p-6 rounded-3xl bg-amber-50/50 border border-amber-100 shadow-luxury space-y-2">
          <div className="flex items-center justify-between text-amber-600">
            <span className="text-xs font-semibold">{t('admin.stats.pending')}</span>
            <Clock className="w-5 h-5" />
          </div>
          <div className="text-3xl font-bold text-amber-700">
            {loading ? '...' : stats?.pendingCount || 0}
          </div>
        </div>

        {/* Confirmed */}
        <div className="p-6 rounded-3xl bg-emerald-50/50 border border-emerald-100 shadow-luxury space-y-2">
          <div className="flex items-center justify-between text-emerald-600">
            <span className="text-xs font-semibold">{t('admin.stats.confirmed')}</span>
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="text-3xl font-bold text-emerald-700">
            {loading ? '...' : stats?.confirmedCount || 0}
          </div>
        </div>

        {/* Cancelled */}
        <div className="p-6 rounded-3xl bg-rose-50/50 border border-rose-100 shadow-luxury space-y-2">
          <div className="flex items-center justify-between text-rose-600">
            <span className="text-xs font-semibold">{t('admin.stats.cancelled')}</span>
            <XCircle className="w-5 h-5" />
          </div>
          <div className="text-3xl font-bold text-rose-700">
            {loading ? '...' : stats?.cancelledCount || 0}
          </div>
        </div>
      </div>

      {/* Room Occupancy Summary */}
      <div className="p-6 rounded-3xl bg-white border border-[#EAEAEA] shadow-luxury space-y-2">
        <div className="flex items-center justify-between text-slate-500">
          <span className="text-xs font-semibold">{t('admin.occupancy')}</span>
          <BedDouble className="w-5 h-5 text-[#B99246]" />
        </div>
        <div className="text-3xl font-bold text-[#111111]">
          {roomsLoaded ? `${occupiedRoomsCount} / ${rooms.length}` : '...'}
        </div>
        <p className="text-[11px] text-[#333333]/60">
          {t('admin.occupancySubtitle')}
        </p>
      </div>

      {/* Recent Reservations Table Preview */}
      <div className="bg-white rounded-3xl border border-[#EAEAEA] shadow-luxury p-6 sm:p-8 space-y-6">
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
              <tr className="border-b border-[#EAEAEA] text-[#333333]/60">
                <th className="pb-3 px-3 font-semibold">{t('admin.table.id')}</th>
                <th className="pb-3 px-3 font-semibold">{t('admin.table.customer')}</th>
                <th className="pb-3 px-3 font-semibold">{t('admin.table.phone')}</th>
                <th className="pb-3 px-3 font-semibold">{t('admin.table.roomType')}</th>
                <th className="pb-3 px-3 font-semibold">{t('admin.table.status')}</th>
                <th className="pb-3 px-3 font-semibold">{t('admin.table.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAEAEA]">
              {recentReservations.map((res) => (
                <tr key={res.id} className="hover:bg-[#FAF9F7]/80 transition-colors">
                  <td className="py-3.5 px-3 font-mono font-bold text-[#111111]">
                    {res.reservationId}
                  </td>
                  <td className="py-3.5 px-3 font-semibold">{res.customerName}</td>
                  <td className="py-3.5 px-3 text-start"><span dir="ltr">{res.phone}</span></td>
                  <td className="py-3.5 px-3 text-[#333333]/80">
                    {(() => {
                      const room = ROOM_TYPES_LIST.find((r) => r.id === res.roomType);
                      return room ? t(`rooms.${room.key}.title`) : res.roomType;
                    })()}
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
