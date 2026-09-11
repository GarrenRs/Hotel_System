'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { reservationFormSchema, ReservationFormValues } from '@/lib/validations/reservation.schema';
import { useLanguage } from '@/components/providers/LanguageContext';
import { ROOM_TYPES_LIST } from '@/lib/constants';
import { RoomEntity } from '@/domain/room/entities';
import { Calendar, CalendarDays, Users, BedDouble, User, Phone, Mail, FileText, CheckCircle2, AlertCircle, KeyRound } from 'lucide-react';

interface BookingFormProps {
  initialRoomType?: string | null;
}

interface SuccessData {
  reservationId: string;
  roomTypeTitle: string;
  roomNumber: string;
  arrivalDate: string;
  departureDate: string;
  guests: number;
}

type AvailabilityStatus = 'idle' | 'loading' | 'ready' | 'error';

export const BookingForm: React.FC<BookingFormProps> = ({ initialRoomType }) => {
  const { t } = useLanguage();
  const defaultRoomType =
    initialRoomType && ROOM_TYPES_LIST.some((r) => r.id === initialRoomType)
      ? initialRoomType
      : ROOM_TYPES_LIST[0].id;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<SuccessData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [availability, setAvailability] = useState<{ status: AvailabilityStatus; rooms: RoomEntity[] }>({
    status: 'idle',
    rooms: [],
  });
  const [refreshKey, setRefreshKey] = useState(0);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ReservationFormValues>({
    resolver: zodResolver(reservationFormSchema),
    defaultValues: {
      guests: 2,
      roomType: defaultRoomType,
      roomId: '',
    },
  });

  const watchArrival = watch('arrivalDate');
  const watchDeparture = watch('departureDate');
  const watchRoomType = watch('roomType');
  const watchGuests = watch('guests');

  const stayNights =
    watchArrival && watchDeparture && watchArrival < watchDeparture
      ? Math.round(
          (Date.UTC(
            Number(watchDeparture.slice(0, 4)),
            Number(watchDeparture.slice(5, 7)) - 1,
            Number(watchDeparture.slice(8, 10))
          ) -
            Date.UTC(
              Number(watchArrival.slice(0, 4)),
              Number(watchArrival.slice(5, 7)) - 1,
              Number(watchArrival.slice(8, 10))
            )) /
            86400000
        )
      : null;

  const pluralWord = (count: number, one: string, two: string, many: string) =>
    count === 1 ? one : count === 2 ? two : many;

  const nightsNoun =
    stayNights !== null
      ? pluralWord(stayNights, t('contact.nightsOne'), t('contact.nightsTwo'), t('contact.nightsMany'))
      : '';
  const daysCount = stayNights !== null ? stayNights + 1 : 0;
  const daysNoun =
    daysCount > 0
      ? pluralWord(daysCount, t('contact.daysOne'), t('contact.daysTwo'), t('contact.daysMany'))
      : '';

  const selectedTypeConfig = useMemo(
    () => ROOM_TYPES_LIST.find((r) => r.id === watchRoomType),
    [watchRoomType]
  );

  // Keep requested guests within the selected room type's capacity.
  useEffect(() => {
    if (selectedTypeConfig && Number(watchGuests) > selectedTypeConfig.capacity) {
      setValue('guests', selectedTypeConfig.capacity, { shouldValidate: true });
    }
  }, [selectedTypeConfig, watchGuests, setValue]);

  const datesValid =
    Boolean(watchArrival) && Boolean(watchDeparture) && watchArrival < watchDeparture;

  // Date-aware availability: the server applies the shared offer rule
  // (status != MAINTENANCE, no conflicting reservation, same/upcoming-day rule).
  useEffect(() => {
    let cancelled = false;

    if (!datesValid) {
      setAvailability({ status: 'idle', rooms: [] });
      return;
    }

    setAvailability({ status: 'loading', rooms: [] });

    async function loadAvailability() {
      try {
        const params = new URLSearchParams({
          arrival: watchArrival,
          departure: watchDeparture,
        });
        if (watchRoomType) params.append('roomType', watchRoomType);

        const res = await fetch(`/api/rooms/available?${params.toString()}`);
        const result = await res.json();

        if (cancelled) return;

        if (res.ok && result.success) {
          setAvailability({ status: 'ready', rooms: result.data });
        } else {
          setAvailability({ status: 'error', rooms: [] });
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) setAvailability({ status: 'error', rooms: [] });
      }
    }

    loadAvailability();

    return () => {
      cancelled = true;
    };
  }, [watchArrival, watchDeparture, watchRoomType, datesValid, refreshKey]);

  const onSubmit = async (data: ReservationFormValues) => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        const key = result.errors?.[0] || 'errors.serverError';
        setErrorMessage(t(key));
        return;
      }

      const created = result.data;
      const chosenRoom = availability.rooms.find((room) => room.id === created.roomId);
      const typeConfig = ROOM_TYPES_LIST.find((r) => r.id === created.roomType);

      setSuccessData({
        reservationId: created.reservationId,
        roomTypeTitle: typeConfig ? t(`rooms.${typeConfig.key}.title`) : String(created.roomType),
        roomNumber: created.roomNumber ?? chosenRoom?.roomNumber ?? '—',
        arrivalDate: created.arrivalDate,
        departureDate: created.departureDate,
        guests: created.guests,
      });

      reset({ roomType: watchRoomType, guests: 2, roomId: '' });
      setRefreshKey((k) => k + 1);
    } catch (err) {
      console.error(err);
      setErrorMessage(t('errors.serverError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const roomTypeTitle = (roomType: string): string => {
    const config = ROOM_TYPES_LIST.find((c) => c.id === roomType);
    return config ? t(`rooms.${config.key}.title`) : roomType;
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-luxury border border-[#CBC4B6] relative overflow-hidden text-start">
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
            {t('admin.table.id')}:{' '}
            <span className="font-bold font-mono text-emerald-950">{successData.reservationId}</span>
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-start">
            <div className="bg-white rounded-xl p-3 border border-emerald-200 text-xs">
              <div className="text-[11px] text-emerald-700/70 font-semibold">
                {t('contact.roomTypeLabel')}
              </div>
              <div className="font-bold text-emerald-950">{successData.roomTypeTitle}</div>
            </div>
            <div className="bg-white rounded-xl p-3 border border-emerald-200 text-xs">
              <div className="text-[11px] text-emerald-700/70 font-semibold">
                {t('contact.roomNumberLabel')}
              </div>
              <div className="font-bold text-emerald-950 font-mono">{successData.roomNumber}</div>
            </div>
            <div className="bg-white rounded-xl p-3 border border-emerald-200 text-xs">
              <div className="text-[11px] text-emerald-700/70 font-semibold">
                {t('contact.arrivalLabel')}
              </div>
              <div className="font-bold text-emerald-950">{successData.arrivalDate}</div>
            </div>
            <div className="bg-white rounded-xl p-3 border border-emerald-200 text-xs">
              <div className="text-[11px] text-emerald-700/70 font-semibold">
                {t('contact.departureLabel')}
              </div>
              <div className="font-bold text-emerald-950">{successData.departureDate}</div>
            </div>
          </div>
          <p className="text-[11px] text-emerald-800 leading-relaxed">
            {t('contact.keepReservationId')}
          </p>
          <button
            onClick={() => setSuccessData(null)}
            className="mt-4 px-6 py-2.5 rounded-full bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-all cursor-pointer"
          >
            {t('contact.bookAnotherRoom')}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Arrival Date */}
            <div className="min-w-0">
              <label className="block text-xs font-semibold text-[#111111] mb-2 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#B99246]" />
                <span>{t('contact.arrivalLabel')}</span>
              </label>
              <input
                type="date"
                {...register('arrivalDate')}
                className="w-full min-w-0 px-4 h-11 rounded-2xl border border-[#CBC4B6] bg-[#FAF9F7] text-xs focus:outline-none focus:border-[#B99246] transition-colors"
              />
              {errors.arrivalDate && (
                <p className="text-[11px] text-rose-500 mt-1">{t(errors.arrivalDate.message || '')}</p>
              )}
            </div>

            {/* Departure Date */}
            <div className="min-w-0">
              <label className="block text-xs font-semibold text-[#111111] mb-2 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#B99246]" />
                <span>{t('contact.departureLabel')}</span>
              </label>
              <input
                type="date"
                {...register('departureDate')}
                className="w-full min-w-0 px-4 h-11 rounded-2xl border border-[#CBC4B6] bg-[#FAF9F7] text-xs focus:outline-none focus:border-[#B99246] transition-colors"
              />
              {errors.departureDate && (
                <p className="text-[11px] text-rose-500 mt-1">{t(errors.departureDate.message || '')}</p>
              )}
            </div>

            {/* Guests */}
            <div className="min-w-0">
              <label className="block text-xs font-semibold text-[#111111] mb-2 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#B99246]" />
                <span>{t('contact.guestsLabel')}</span>
              </label>
              <input
                type="number"
                min="1"
                max={selectedTypeConfig?.capacity ?? 10}
                {...register('guests')}
                className="w-full min-w-0 px-4 h-11 rounded-2xl border border-[#CBC4B6] bg-[#FAF9F7] text-xs focus:outline-none focus:border-[#B99246] transition-colors"
              />
              {selectedTypeConfig && Number(watchGuests) > 0 && !errors.guests && (
                <p className="text-[11px] text-[#333333]/60 mt-1">
                  {t('contact.capacityLabel')}: {selectedTypeConfig.capacity}
                </p>
              )}
              {errors.guests && (
                <p className="text-[11px] text-rose-500 mt-1">{t(errors.guests.message || '')}</p>
              )}
            </div>
          </div>

          {/* Stay duration summary */}
          {stayNights !== null && (
            <div className="flex items-center justify-center sm:justify-start gap-2 text-[11px] font-semibold text-[#111111] bg-[#F5EFE0] border border-[#B99246]/30 rounded-full px-4 py-2">
              <CalendarDays className="w-4 h-4 text-[#B99246]" />
              <span className="text-[#B99246]">{t('contact.stayDuration')}:</span>
              <span>{stayNights} {nightsNoun} · {daysCount} {daysNoun}</span>
            </div>
          )}

          {/* Room Type */}
          <div>
            <label className="block text-xs font-semibold text-[#111111] mb-2 flex items-center gap-1.5">
              <BedDouble className="w-3.5 h-3.5 text-[#B99246]" />
              <span>{t('contact.roomTypeLabel')}</span>
            </label>
            <select
              {...register('roomType', { onChange: () => setValue('roomId', '', { shouldValidate: true }) })}
              className="w-full px-4 h-11 rounded-2xl border border-[#CBC4B6] bg-[#FAF9F7] text-xs focus:outline-none focus:border-[#B99246] transition-colors cursor-pointer"
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

          {/* Room Selection — offerable rooms for the chosen dates & type */}
          <div>
            <label className="block text-xs font-semibold text-[#111111] mb-2 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-[#B99246]" />
              <span>{t('contact.selectRoomLabel')}</span>
            </label>
            {!datesValid ? (
              <p className="text-[11px] text-[#333333]/60 mt-1">
                {t('contact.selectDatesHint')}
              </p>
            ) : (
              <>
                <select
                  {...register('roomId')}
                  className="w-full px-4 h-11 rounded-2xl border border-[#CBC4B6] bg-[#FAF9F7] text-xs focus:outline-none focus:border-[#B99246] transition-colors cursor-pointer disabled:opacity-50"
                  disabled={availability.status !== 'ready'}
                >
                  <option value="">
                    {availability.status === 'loading' ? '...' : t('contact.selectRoomLabel')}
                  </option>
                  {availability.rooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {t('admin.roomsSection.room')} {room.roomNumber} — {roomTypeTitle(String(room.roomType))}
                    </option>
                  ))}
                </select>
                {availability.status === 'ready' && availability.rooms.length === 0 && (
                  <p className="text-[11px] text-amber-600 mt-1">
                    {t('contact.noAvailableRooms')}
                  </p>
                )}
                {availability.status === 'error' && (
                  <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-[11px] mt-1">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{t('errors.roomsLoadFailed')}</span>
                  </div>
                )}
              </>
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
                className="w-full px-4 h-11 rounded-2xl border border-[#CBC4B6] bg-[#FAF9F7] text-xs focus:outline-none focus:border-[#B99246] transition-colors"
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
                className="w-full px-4 h-11 rounded-2xl border border-[#CBC4B6] bg-[#FAF9F7] text-xs focus:outline-none focus:border-[#B99246] transition-colors"
              />
              {errors.phone && (
                <p className="text-[11px] text-rose-500 mt-1">{t(errors.phone.message || '')}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-[#111111] mb-2 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#B99246]" />
                <span>
                  {t('contact.emailLabel')}{' '}
                  <span className="font-normal text-[#333333]/50">{t('contact.optional')}</span>
                </span>
              </label>
              <input
                type="email"
                placeholder="client@example.dz"
                {...register('email')}
                className="w-full px-4 h-11 rounded-2xl border border-[#CBC4B6] bg-[#FAF9F7] text-xs focus:outline-none focus:border-[#B99246] transition-colors"
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
              className="w-full p-4 rounded-2xl border border-[#CBC4B6] bg-[#FAF9F7] text-xs focus:outline-none focus:border-[#B99246] transition-colors"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || availability.status === 'loading'}
            className="w-full h-12 rounded-2xl bg-[#B99246] text-[#111111] font-bold text-xs uppercase tracking-widest hover:bg-[#D4AF37] transition-all shadow-lg shadow-[#B99246]/20 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? '...' : t('common.reserveNow')}
          </button>
        </form>
      )}
    </div>
  );
};