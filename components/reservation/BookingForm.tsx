'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { reservationFormSchema, ReservationFormValues } from '@/lib/validations/reservation.schema';
import { useLanguage } from '@/components/providers/LanguageContext';
import { ROOM_TYPES_LIST } from '@/lib/constants';
import { RoomEntity } from '@/domain/room/entities';
import { RoomStatus } from '@/domain/room/enums';
import { Calendar, Users, BedDouble, User, Phone, Mail, FileText, CheckCircle2, AlertCircle, KeyRound } from 'lucide-react';

const ROOMS_RETRY_ATTEMPTS = 5;
const ROOMS_RETRY_DELAY_MS = 800;

interface BookingFormProps {
  initialRoomType?: string | null;
}

export const BookingForm: React.FC<BookingFormProps> = ({ initialRoomType }) => {
  const { t } = useLanguage();
  const defaultRoomType =
    initialRoomType && ROOM_TYPES_LIST.some((r) => r.id === initialRoomType)
      ? initialRoomType
      : ROOM_TYPES_LIST[0].id;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<{ reservationId: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [roomState, setRoomState] = useState<{ status: 'loading' | 'ready' | 'error'; rooms: RoomEntity[] }>({
    status: 'loading',
    rooms: [],
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedRoomType, setSelectedRoomType] = useState<string>(defaultRoomType);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ReservationFormValues>({
    resolver: zodResolver(reservationFormSchema),
    defaultValues: {
      guests: 2,
      roomType: defaultRoomType,
      roomId: '',
    },
  });

  useEffect(() => {
    let cancelled = false;
    let attempt = 0;

    // Briefly retry on a transient empty/failure instead of showing an error.
    async function poll() {
      try {
        const res = await fetch('/api/rooms');
        const result = await res.json();

        if (!result.success) {
          throw new Error(result.message || 'Failed to fetch rooms');
        }

        if (cancelled) return;

        const available = result.data.filter(
          (room: RoomEntity) => room.roomType === selectedRoomType && room.status === RoomStatus.AVAILABLE
        );
        setRoomState({ status: 'ready', rooms: available });
      } catch (err) {
        console.error(err);
        if (cancelled) return;

        if (attempt < ROOMS_RETRY_ATTEMPTS) {
          attempt += 1;
          setTimeout(poll, ROOMS_RETRY_DELAY_MS);
        } else {
          setRoomState({ status: 'error', rooms: [] });
        }
      }
    }

    poll();

    return () => {
      cancelled = true;
    };
  }, [selectedRoomType, refreshKey]);

  const onSubmit = async (data: ReservationFormValues) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessData(null);

    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.errors?.[0] || result.message || 'Failed to submit reservation request');
      }

      setSuccessData({ reservationId: result.data.reservationId });
      reset({ roomType: selectedRoomType, guests: 2, roomId: '' });
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : t('errors.serverError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const roomTypeTitle = (roomType: RoomEntity['roomType']): string => {
    const config = ROOM_TYPES_LIST.find((c) => c.id === roomType);
    return config ? t(`rooms.${config.key}.title`) : String(roomType);
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-luxury border border-[#EAEAEA] relative overflow-hidden text-start">
      {/* Accent Top Bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#B99246] via-[#D4AF37] to-[#8C6D27]" />

      <h2 className="text-2xl sm:text-3xl font-bold text-[#111111] mb-2 tracking-tight">
        {t('common.reserveNow')}
      </h2>
      <p className="text-xs sm:text-sm text-[#333333]/70 mb-8">
        {t('home.hero.subtitle')}
      </p>

      {successData ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-4 animate-fadeIn">
          <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
          <h3 className="text-base sm:text-lg font-bold text-emerald-900">
            {t('contact.bookingConfirmedMessage')}
          </h3>
          <p className="text-xs text-emerald-800">
            {t('admin.table.id')}: <span className="font-bold font-mono text-emerald-950">{successData.reservationId}</span>
          </p>
          <button
            onClick={() => setSuccessData(null)}
            className="mt-4 px-6 py-2.5 rounded-full bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-all cursor-pointer"
          >
            {t('common.reserveNow')}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {errorMessage && (
            <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl text-xs">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Dates & Guests Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Arrival Date */}
            <div>
              <label className="block text-xs font-semibold text-[#111111] mb-2 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#B99246]" />
                <span>{t('admin.table.arrival')}</span>
              </label>
              <input
                type="date"
                {...register('arrivalDate')}
                className="w-full px-4 h-11 rounded-2xl border border-[#EAEAEA] bg-[#FAF9F7] text-xs focus:outline-none focus:border-[#B99246] transition-colors"
              />
              {errors.arrivalDate && (
                <p className="text-[11px] text-rose-500 mt-1">{t(errors.arrivalDate.message || '')}</p>
              )}
            </div>

            {/* Departure Date */}
            <div>
              <label className="block text-xs font-semibold text-[#111111] mb-2 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#B99246]" />
                <span>{t('admin.table.departure')}</span>
              </label>
              <input
                type="date"
                {...register('departureDate')}
                className="w-full px-4 h-11 rounded-2xl border border-[#EAEAEA] bg-[#FAF9F7] text-xs focus:outline-none focus:border-[#B99246] transition-colors"
              />
              {errors.departureDate && (
                <p className="text-[11px] text-rose-500 mt-1">{t(errors.departureDate.message || '')}</p>
              )}
            </div>

            {/* Guests */}
            <div>
              <label className="block text-xs font-semibold text-[#111111] mb-2 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#B99246]" />
                <span>{t('admin.table.guests')}</span>
              </label>
              <input
                type="number"
                min="1"
                max="10"
                {...register('guests')}
                className="w-full px-4 h-11 rounded-2xl border border-[#EAEAEA] bg-[#FAF9F7] text-xs focus:outline-none focus:border-[#B99246] transition-colors"
              />
              {errors.guests && (
                <p className="text-[11px] text-rose-500 mt-1">{t(errors.guests.message || '')}</p>
              )}
            </div>
          </div>

          {/* Room Type */}
          <div>
            <label className="block text-xs font-semibold text-[#111111] mb-2 flex items-center gap-1.5">
              <BedDouble className="w-3.5 h-3.5 text-[#B99246]" />
              <span>{t('admin.table.roomType')}</span>
            </label>
            <select
              {...register('roomType', { onChange: (e) => setSelectedRoomType(e.target.value) })}
              className="w-full px-4 h-11 rounded-2xl border border-[#EAEAEA] bg-[#FAF9F7] text-xs focus:outline-none focus:border-[#B99246] transition-colors cursor-pointer"
            >
              {ROOM_TYPES_LIST.map((room) => (
                <option key={room.id} value={room.id}>
                  {t(`rooms.${room.key}.title`)} ({room.priceDZD} {t('rooms.perNight')})
                </option>
              ))}
            </select>
            {errors.roomType && (
              <p className="text-[11px] text-rose-500 mt-1">{t(errors.roomType.message || '')}</p>
            )}
          </div>

          {/* Room Selection — live AVAILABLE rooms for the chosen type */}
          <div>
            <label className="block text-xs font-semibold text-[#111111] mb-2 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-[#B99246]" />
              <span>{t('admin.roomsSection.selectRoom')}</span>
            </label>
            <select
              {...register('roomId')}
              className="w-full px-4 h-11 rounded-2xl border border-[#EAEAEA] bg-[#FAF9F7] text-xs focus:outline-none focus:border-[#B99246] transition-colors cursor-pointer disabled:opacity-50"
              disabled={roomState.status !== 'ready'}
            >
              <option value="">
                {roomState.status === 'loading' ? '...' : t('admin.roomsSection.selectRoom')}
              </option>
              {roomState.rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {t('admin.roomsSection.room')} {room.roomNumber} — {roomTypeTitle(room.roomType)}
                </option>
              ))}
            </select>
            {roomState.status === 'ready' && roomState.rooms.length === 0 && (
              <p className="text-[11px] text-amber-600 mt-1">{t('admin.roomsSection.noAvailableRooms')}</p>
            )}
            {roomState.status === 'error' && (
              <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-[11px] mt-1">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{t('errors.roomsLoadFailed')}</span>
              </div>
            )}
            {errors.roomId && (
              <p className="text-[11px] text-rose-500 mt-1">{t(errors.roomId.message || '')}</p>
            )}
          </div>

          {/* Customer Personal Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-[#111111] mb-2 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#B99246]" />
                <span>{t('contact.nameLabel')}</span>
              </label>
              <input
                type="text"
                placeholder="Karim Benzema"
                {...register('customerName')}
                className="w-full px-4 h-11 rounded-2xl border border-[#EAEAEA] bg-[#FAF9F7] text-xs focus:outline-none focus:border-[#B99246] transition-colors"
              />
              {errors.customerName && (
                <p className="text-[11px] text-rose-500 mt-1">{t(errors.customerName.message || '')}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-[#111111] mb-2 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#B99246]" />
                <span>{t('contact.phoneLabel')}</span>
              </label>
              <input
                type="tel"
                placeholder="+213 550 00 00 00"
                {...register('phone')}
                className="w-full px-4 h-11 rounded-2xl border border-[#EAEAEA] bg-[#FAF9F7] text-xs focus:outline-none focus:border-[#B99246] transition-colors"
              />
              {errors.phone && (
                <p className="text-[11px] text-rose-500 mt-1">{t(errors.phone.message || '')}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-[#111111] mb-2 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#B99246]" />
                <span>{t('contact.emailLabel')}</span>
              </label>
              <input
                type="email"
                placeholder="client@example.dz"
                {...register('email')}
                className="w-full px-4 h-11 rounded-2xl border border-[#EAEAEA] bg-[#FAF9F7] text-xs focus:outline-none focus:border-[#B99246] transition-colors"
              />
              {errors.email && (
                <p className="text-[11px] text-rose-500 mt-1">{t(errors.email.message || '')}</p>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-[#111111] mb-2 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#B99246]" />
              <span>{t('admin.details.notes')}</span>
            </label>
            <textarea
              rows={3}
              placeholder="..."
              {...register('notes')}
              className="w-full p-4 rounded-2xl border border-[#EAEAEA] bg-[#FAF9F7] text-xs focus:outline-none focus:border-[#B99246] transition-colors"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 rounded-2xl bg-[#B99246] text-[#111111] font-bold text-xs uppercase tracking-widest hover:bg-[#D4AF37] transition-all shadow-lg shadow-[#B99246]/20 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? '...' : t('common.reserveNow')}
          </button>
        </form>
      )}
    </div>
  );
};