'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/components/providers/LanguageContext';
import { ReservationEntity } from '@/domain/reservation/entities';
import { ReservationStatus } from '@/domain/reservation/enums';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { ROOM_TYPES_LIST } from '@/lib/constants';
import { Search, Eye, RefreshCw } from 'lucide-react';

const BOOT_RETRY_ATTEMPTS = 4;
const BOOT_RETRY_DELAY_MS = 1200;

export default function AdminReservationsPage() {
  const { t } = useLanguage();
  const [reservations, setReservations] = useState<ReservationEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedRoomType, setSelectedRoomType] = useState<string>('ALL');
  const didBootstrap = useRef(false);

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedStatus !== 'ALL') params.append('status', selectedStatus);
      if (selectedRoomType !== 'ALL') params.append('roomType', selectedRoomType);
      if (searchQuery.trim() !== '') params.append('searchQuery', searchQuery);

      const res = await fetch(`/api/reservations?${params.toString()}`);
      const result = await res.json();
      if (result.success) {
        setReservations(result.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!didBootstrap.current) {
      didBootstrap.current = true;
      return;
    }
    setTimeout(() => fetchReservations(), 0);
  }, [selectedStatus, selectedRoomType]);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap(attempt: number): Promise<void> {
      try {
        const res = await fetch('/api/reservations');
        const result = await res.json();

        if (cancelled) return;

        if (result.success && result.data.length > 0) {
          setReservations(result.data);
          setLoading(false);
          return;
        }

        if (attempt >= BOOT_RETRY_ATTEMPTS) {
          setLoading(false);
          return;
        }

        setTimeout(() => bootstrap(attempt + 1), BOOT_RETRY_DELAY_MS);
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          if (attempt < BOOT_RETRY_ATTEMPTS) {
            setTimeout(() => bootstrap(attempt + 1), BOOT_RETRY_DELAY_MS);
          } else {
            setLoading(false);
          }
        }
      }
    }

    bootstrap(0);

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTimeout(() => fetchReservations(), 0);
  };

  return (
    <div className="space-y-6 animate-fadeIn text-start">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#CBC4B6] pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111111]">
            {t('admin.reservations')}
          </h1>
          <p className="text-xs text-[#333333]/70">
            {t('admin.reservationsSubtitle')}
          </p>
        </div>
        <button
          onClick={fetchReservations}
          className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#B99246]/40 text-[#B99246] text-xs font-semibold hover:bg-[#B99246]/10 transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{t('admin.actions.refresh')}</span>
        </button>
      </div>

      {/* Search & Filters Bar */}
      <div className="bg-white rounded-3xl p-6 border border-[#CBC4B6] shadow-luxury space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-[#B99246] absolute top-3.5 start-4 pointer-events-none" />
            <input
              type="text"
              placeholder={t('admin.filters.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full ps-11 pe-4 py-3 rounded-2xl border border-[#CBC4B6] bg-[#FAF9F7] text-xs focus:outline-none focus:border-[#B99246]"
            />
          </div>

          {/* Status Filter */}
          <div className="w-full md:w-48">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-[#CBC4B6] bg-[#FAF9F7] text-xs focus:outline-none focus:border-[#B99246] cursor-pointer"
            >
              <option value="ALL">{t('admin.filters.allStatuses')}</option>
              {Object.values(ReservationStatus).map((st) => (
                <option key={st} value={st}>
                  {t(`common.status.${st.toLowerCase()}`)}
                </option>
              ))}
            </select>
          </div>

          {/* Room Type Filter */}
          <div className="w-full md:w-56">
            <select
              value={selectedRoomType}
              onChange={(e) => setSelectedRoomType(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-[#CBC4B6] bg-[#FAF9F7] text-xs focus:outline-none focus:border-[#B99246] cursor-pointer"
            >
              <option value="ALL">{t('admin.filters.allRoomTypes')}</option>
              {ROOM_TYPES_LIST.map((room) => (
                <option key={room.id} value={room.id}>
                  {t(`rooms.${room.key}.title`)}
                </option>
              ))}
            </select>
          </div>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-[#CBC4B6] shadow-luxury overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-start">
            <thead>
              <tr className="bg-[#111111] text-white">
                <th className="py-4 px-4 font-semibold text-start">{t('admin.table.id')}</th>
                <th className="py-4 px-4 font-semibold text-start">{t('admin.table.customer')}</th>
                <th className="py-4 px-4 font-semibold text-start">{t('admin.table.phone')}</th>
                <th className="py-4 px-4 font-semibold text-start">{t('admin.table.roomNumber')}</th>
                <th className="py-4 px-4 font-semibold text-start">{t('admin.table.arrival')}</th>
                <th className="py-4 px-4 font-semibold text-start">{t('admin.table.departure')}</th>
                <th className="py-4 px-4 font-semibold text-start">{t('admin.table.status')}</th>
                <th className="py-4 px-4 font-semibold text-center">{t('admin.table.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#CBC4B6]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#333333]/50">
                    ...
                  </td>
                </tr>
              ) : reservations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#333333]/50">
                    ...
                  </td>
                </tr>
              ) : (
                reservations.map((res) => (
                  <tr key={res.id} className="hover:bg-[#FAF9F7]/80 transition-colors">
                    <td className="py-4 px-4 font-mono font-bold text-[#111111]">
                      {res.reservationId}
                    </td>
                    <td className="py-4 px-4 font-semibold">
                      <div>{res.customerName}</div>
                      <div className="text-[11px] text-[#333333]/60">{res.email}</div>
                    </td>
                    <td className="py-4 px-4 font-medium"><span dir="ltr">{res.phone}</span></td>
                    <td className="py-4 px-4 font-mono text-[#333333]/80">
                      {res.roomNumber ?? '—'}
                    </td>
                    <td className="py-4 px-4 text-[#333333]/80">{res.arrivalDate}</td>
                    <td className="py-4 px-4 text-[#333333]/80">{res.departureDate}</td>
                    <td className="py-4 px-4">
                      <StatusBadge status={res.status} />
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          href={`/admin/reservations/${res.id}`}
                          className="p-2 rounded-full bg-slate-100 text-slate-700 hover:bg-[#B99246] hover:text-[#111111] transition-all"
                          title={t('admin.actions.view')}
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}