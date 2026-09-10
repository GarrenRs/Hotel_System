'use client';

import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/components/providers/LanguageContext';
import { RoomEntity } from '@/domain/room/entities';
import { RoomStatus } from '@/domain/room/enums';
import { ROOM_TYPES_LIST } from '@/lib/constants';
import { ROOM_STATUS_UI, ROOM_TRANSITIONS, transitionLabelKey } from '@/lib/status';
import { RefreshCw, ChevronDown, DoorOpen, AlertCircle } from 'lucide-react';

const BOOT_RETRY_ATTEMPTS = 4;
const BOOT_RETRY_DELAY_MS = 1200;

interface MaintenanceWarning {
  reservationId: string;
  customerName: string;
  arrivalDate: string;
  departureDate: string;
}

export default function AdminRoomsPage() {
  const { t } = useLanguage();
  const [rooms, setRooms] = useState<RoomEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [openRoomId, setOpenRoomId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [maintenanceWarnings, setMaintenanceWarnings] = useState<Record<string, MaintenanceWarning[]>>({});

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/rooms');
      const result = await res.json();
      if (result.success) {
        setRooms(result.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function bootstrap(attempt: number): Promise<void> {
      try {
        const res = await fetch('/api/rooms');
        const result = await res.json();

        if (cancelled) return;

        if (result.success && result.data.length > 0) {
          setRooms(result.data);
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

  const handleTransition = async (roomId: string, newStatus: string) => {
    if (savingId) return;

    const previousStatus = rooms.find((r) => r.id === roomId)?.status;

    setSavingId(roomId);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/rooms/${roomId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const result = await res.json();

      if (result.success) {
        const { room, warnings } = result.data;
        setRooms((prev) => prev.map((r) => (r.id === roomId ? { ...r, ...room } : r)));
        if (newStatus === RoomStatus.MAINTENANCE) {
          setMaintenanceWarnings((prev) => ({ ...prev, [roomId]: warnings }));
        }
      } else {
        const key = result.errors?.[0] || 'admin.errors.invalidRoomTransition';
        setErrorMessage(t(key));
      }
    } catch (err) {
      console.error(err);
      setRooms((prev) =>
        prev.map((r) => (r.id === roomId ? { ...r, status: previousStatus } : r))
      );
      setErrorMessage(t('errors.serverError'));
    } finally {
      setSavingId(null);
    }
  };

  const statusCounts = (Object.keys(ROOM_STATUS_UI) as RoomStatus[]).map((status) => ({
    status,
    count: rooms.filter((r) => r.status === status).length,
  }));

  const roomTypeTitle = (roomType: RoomEntity['roomType']): string => {
    const config = ROOM_TYPES_LIST.find((c) => c.id === roomType);
    return config ? t(`rooms.${config.key}.title`) : String(roomType);
  };

  return (
    <div className="space-y-6 animate-fadeIn text-start">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#EAEAEA] pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111111]">
            {t('admin.rooms')}
          </h1>
          <p className="text-xs text-[#333333]/70">
            {t('admin.roomsSubtitle')}
          </p>
        </div>
        <button
          onClick={fetchRooms}
          className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#B99246]/40 text-[#B99246] text-xs font-semibold hover:bg-[#B99246]/10 transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{t('admin.actions.refresh')}</span>
        </button>
      </div>

      {/* Live Status Counts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
        {statusCounts.map(({ status, count }) => {
          const config = ROOM_STATUS_UI[status];
          return (
            <div
              key={status}
              className={`p-4 rounded-2xl border ${config.badgeBg} flex items-center justify-between gap-2`}
            >
              <span className="text-xs font-bold leading-tight">
                {t(config.labelKey)}
              </span>
              <span className="text-2xl font-bold">{loading ? '...' : count}</span>
            </div>
          );
        })}
      </div>

      {errorMessage && (
        <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl text-xs">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Room Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {rooms.map((room) => {
          const statusUi = ROOM_STATUS_UI[room.status as RoomStatus];
          const isOpen = openRoomId === room.id;
          const allowedTransitions = ROOM_TRANSITIONS[room.status as RoomStatus] ?? [];
          const warnings = maintenanceWarnings[room.id] ?? [];
          const isOccupied = room.status === RoomStatus.OCCUPIED;

          return (
            <div
              key={room.id}
              className="bg-white rounded-3xl border border-[#EAEAEA] shadow-luxury hover:shadow-lg transition-shadow overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setOpenRoomId(isOpen ? null : room.id)}
                className="w-full p-6 text-start cursor-pointer"
              >
                <div className="flex items-center justify-between text-[#333333]/50 mb-3">
                  <span className="text-[11px] font-bold uppercase tracking-widest">
                    {t('admin.roomsSection.room')}
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-3xl font-bold text-[#111111] leading-none">
                      {room.roomNumber}
                    </div>
                    <div className="mt-2 text-xs text-[#333333]/60 font-medium">
                      {roomTypeTitle(room.roomType)}
                    </div>
                  </div>
                  <DoorOpen className="w-7 h-7 text-[#B99246]/40 shrink-0" />
                </div>
                <div className="mt-4">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusUi.badgeBg}`}
                  >
                    <span className="text-[10px]">{statusUi.dot}</span>
                    <span>{t(statusUi.labelKey)}</span>
                  </span>
                </div>
              </button>

              {isOpen && (
                <div className="px-6 pb-6 border-t border-[#EAEAEA] pt-4 space-y-4">
                  {isOccupied ? (
                    <div className="space-y-2">
                      <p className="text-[11px] font-bold text-[#333333]/60">
                        {t('admin.roomsSection.currentGuest')}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-[#111111]">
                          {room.currentGuestName || '—'}
                        </span>
                        {room.currentGuestDeparture && (
                          <span className="text-[11px] text-[#333333]/60" dir="ltr">
                            {t('admin.table.departure')}: {room.currentGuestDeparture}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : allowedTransitions.length === 0 ? (
                    <p className="text-[11px] text-[#333333]/60">
                      {t('admin.roomsSection.noActions')}
                    </p>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-[11px] font-bold text-[#333333]/60">
                        {t('admin.roomsSection.changeStatus')}
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {allowedTransitions.map((target) => (
                          <button
                            key={target}
                            type="button"
                            disabled={savingId === room.id && openRoomId === room.id}
                            onClick={() => handleTransition(room.id, target)}
                            className="px-3 py-2 rounded-xl text-[11px] font-bold border border-[#B99246]/40 text-[#B99246] hover:bg-[#B99246] hover:text-[#111111] transition-all cursor-pointer disabled:opacity-40"
                          >
                            {t(transitionLabelKey(room.status as string, target))}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {warnings.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2">
                      <p className="text-[11px] font-bold text-amber-800">
                        {t('admin.roomsSection.maintenanceWarnings')}
                      </p>
                      <ul className="space-y-1.5 text-[11px] text-amber-900">
                        {warnings.map((warning) => (
                          <li key={warning.reservationId} className="flex justify-between gap-2">
                            <span className="font-bold">
                              {warning.customerName} ({warning.reservationId})
                            </span>
                            <span dir="ltr">
                              {warning.arrivalDate} → {warning.departureDate}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!loading && rooms.length === 0 && (
        <div className="bg-white rounded-3xl border border-[#EAEAEA] shadow-luxury p-10 text-center text-xs text-[#333333]/50">
          ...
        </div>
      )}
    </div>
  );
}