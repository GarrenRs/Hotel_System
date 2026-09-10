'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/components/providers/LanguageContext';
import { ReservationEntity } from '@/domain/reservation/entities';
import { ReservationStatus } from '@/domain/reservation/enums';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { RESERVATION_TRANSITIONS, transitionLabelKey } from '@/lib/status';
import { ROOM_TYPES_LIST } from '@/lib/constants';
import { ArrowLeft, User, Phone, Mail, Calendar, BedDouble, DoorOpen, Users, FileText, Trash2, AlertCircle } from 'lucide-react';

export default function ReservationDetailPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [reservation, setReservation] = useState<ReservationEntity | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDetail() {
      try {
        const res = await fetch(`/api/reservations/${id}`);
        const result = await res.json();
        if (result.success) {
          setReservation(result.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchDetail();
  }, [id]);

  const handleTransition = async (newStatus: string) => {
    if (!reservation) return;
    setUpdating(true);
    setStatusError(null);
    try {
      const res = await fetch(`/api/reservations/${reservation.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const result = await res.json();
      if (result.success) {
        setReservation(result.data);
      } else {
        const key = result.errors?.[0] || 'admin.errors.updateFailed';
        setStatusError(t(key));
      }
    } catch (err) {
      console.error(err);
      setStatusError(t('admin.errors.updateFailed'));
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!reservation || !confirm(t('admin.details.deleteConfirm'))) return;
    try {
      const res = await fetch(`/api/reservations/${reservation.id}`, {
        method: 'DELETE',
      });
      const result = await res.json();
      if (result.success) {
        router.push('/admin/reservations');
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-xs text-[#333333]/60">
        ...
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="py-20 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-[#111111]">{t('errors.reservationNotFound')}</h2>
        <Link
          href="/admin/reservations"
          className="inline-block px-5 py-2 rounded-full bg-[#111111] text-[#B99246] text-xs font-semibold"
        >
          {t('admin.reservations')}
        </Link>
      </div>
    );
  }

  const currentStatus = reservation.status as ReservationStatus;
  const allowedTransitions = RESERVATION_TRANSITIONS[currentStatus] ?? [];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn text-start">
      {/* Top Navigation Back Button */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/reservations"
          className="inline-flex items-center gap-2 text-xs font-bold text-[#B99246] hover:underline"
        >
          <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
          <span>{t('admin.reservations')}</span>
        </Link>
        <button
          onClick={handleDelete}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-rose-50 text-rose-600 text-xs font-bold hover:bg-rose-600 hover:text-white transition-all cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
          <span>{t('admin.actions.delete')}</span>
        </button>
      </div>

      {statusError && (
        <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl text-xs">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{statusError}</span>
        </div>
      )}

      {/* Main Card */}
      <div className="bg-white rounded-3xl p-8 border border-[#EAEAEA] shadow-luxury space-y-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#B99246] via-[#D4AF37] to-[#8C6D27]" />

        {/* Card Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#EAEAEA] pb-6">
          <div>
            <div className="text-xs font-bold text-[#B99246] uppercase tracking-wider">
              {t('admin.details.title')}
            </div>
            <h1 className="text-2xl font-bold font-mono text-[#111111]">
              {reservation.reservationId}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={reservation.status} />
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
          {/* Customer Name */}
          <div className="p-4 rounded-2xl bg-[#FAF9F7] border border-[#EAEAEA] space-y-1">
            <div className="text-[#333333]/60 flex items-center gap-1.5 font-semibold">
              <User className="w-3.5 h-3.5 text-[#B99246]" />
              <span>{t('admin.table.customer')}</span>
            </div>
            <div className="text-sm font-bold text-[#111111]">{reservation.customerName}</div>
          </div>

          {/* Phone */}
          <div className="p-4 rounded-2xl bg-[#FAF9F7] border border-[#EAEAEA] space-y-1">
            <div className="text-[#333333]/60 flex items-center gap-1.5 font-semibold">
              <Phone className="w-3.5 h-3.5 text-[#B99246]" />
              <span>{t('admin.table.phone')}</span>
            </div>
            <div className="text-sm font-bold text-[#111111]"><span dir="ltr">{reservation.phone}</span></div>
          </div>

          {/* Email */}
          <div className="p-4 rounded-2xl bg-[#FAF9F7] border border-[#EAEAEA] space-y-1">
            <div className="text-[#333333]/60 flex items-center gap-1.5 font-semibold">
              <Mail className="w-3.5 h-3.5 text-[#B99246]" />
              <span>{t('admin.table.email')}</span>
            </div>
            <div className="text-sm font-bold text-[#111111]">{reservation.email}</div>
          </div>

          {/* Room Number */}
          <div className="p-4 rounded-2xl bg-[#FAF9F7] border border-[#EAEAEA] space-y-1">
            <div className="text-[#333333]/60 flex items-center gap-1.5 font-semibold">
              <DoorOpen className="w-3.5 h-3.5 text-[#B99246]" />
              <span>{t('admin.table.roomNumber')}</span>
            </div>
            <div className="text-sm font-bold text-[#111111] font-mono">
              {reservation.roomNumber ?? '—'}
            </div>
          </div>

          {/* Room Type */}
          <div className="p-4 rounded-2xl bg-[#FAF9F7] border border-[#EAEAEA] space-y-1">
            <div className="text-[#333333]/60 flex items-center gap-1.5 font-semibold">
              <BedDouble className="w-3.5 h-3.5 text-[#B99246]" />
              <span>{t('admin.table.roomType')}</span>
            </div>
            <div className="text-sm font-bold text-[#111111]">
              {(() => {
                const room = ROOM_TYPES_LIST.find((r) => r.id === reservation.roomType);
                return room ? t(`rooms.${room.key}.title`) : reservation.roomType;
              })()}
            </div>
          </div>

          {/* Arrival */}
          <div className="p-4 rounded-2xl bg-[#FAF9F7] border border-[#EAEAEA] space-y-1">
            <div className="text-[#333333]/60 flex items-center gap-1.5 font-semibold">
              <Calendar className="w-3.5 h-3.5 text-[#B99246]" />
              <span>{t('admin.table.arrival')}</span>
            </div>
            <div className="text-sm font-bold text-[#111111]">{reservation.arrivalDate}</div>
          </div>

          {/* Departure */}
          <div className="p-4 rounded-2xl bg-[#FAF9F7] border border-[#EAEAEA] space-y-1">
            <div className="text-[#333333]/60 flex items-center gap-1.5 font-semibold">
              <Calendar className="w-3.5 h-3.5 text-[#B99246]" />
              <span>{t('admin.table.departure')}</span>
            </div>
            <div className="text-sm font-bold text-[#111111]">{reservation.departureDate}</div>
          </div>

          {/* Guests */}
          <div className="p-4 rounded-2xl bg-[#FAF9F7] border border-[#EAEAEA] space-y-1">
            <div className="text-[#333333]/60 flex items-center gap-1.5 font-semibold">
              <Users className="w-3.5 h-3.5 text-[#B99246]" />
              <span>{t('admin.table.guests')}</span>
            </div>
            <div className="text-sm font-bold text-[#111111]">{reservation.guests}</div>
          </div>
        </div>

        {/* Notes */}
        {reservation.notes && (
          <div className="p-4 rounded-2xl bg-[#FAF9F7] border border-[#EAEAEA] space-y-2 text-xs">
            <div className="text-[#333333]/60 flex items-center gap-1.5 font-semibold">
              <FileText className="w-3.5 h-3.5 text-[#B99246]" />
              <span>{t('admin.details.notes')}</span>
            </div>
            <p className="text-xs text-[#111111] leading-relaxed whitespace-pre-wrap">
              {reservation.notes}
            </p>
          </div>
        )}

        {/* Contextual Status Actions (single transition per state) */}
        <div className="pt-6 border-t border-[#EAEAEA] space-y-4">
          <h3 className="text-xs font-bold text-[#111111] uppercase tracking-wider">
            {t('admin.details.changeStatus')}
          </h3>
          {allowedTransitions.length === 0 ? (
            <p className="text-xs text-[#333333]/60">
              {t('admin.details.noTransitions')}
            </p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {allowedTransitions.map((target) => (
                <button
                  key={target}
                  onClick={() => handleTransition(target)}
                  disabled={updating}
                  className="px-5 py-2.5 rounded-full bg-[#111111] text-[#B99246] text-xs font-bold hover:bg-[#B99246] hover:text-[#111111] transition-all cursor-pointer disabled:opacity-50"
                >
                  {t(transitionLabelKey(currentStatus, target))}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}