'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { BookingForm } from '@/components/reservation/BookingForm';
import { useLanguage } from '@/components/providers/LanguageContext';
import { ROOM_TYPES_LIST } from '@/lib/constants';
import { HOTEL } from '@/config/hotel';
import { MapPin, Phone, Mail } from 'lucide-react';
import { FaWhatsapp, FaInstagram, FaFacebook } from 'react-icons/fa';
import { FaTiktok } from 'react-icons/fa6';
import { PhoneNumber } from '@/components/ui/PhoneNumber';

function ContactBookingForm() {
  const searchParams = useSearchParams();
  const roomKey = searchParams.get('room');
  const matchedRoomType = ROOM_TYPES_LIST.find((room) => room.key === roomKey);

  return <BookingForm initialRoomType={matchedRoomType?.id ?? null} />;
}

export default function ContactPage() {
  const { t } = useLanguage();

  return (
    <div className="pt-32 pb-24 space-y-16">
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
        <span className="text-xs font-bold text-[#B99246] uppercase tracking-widest">
          {t('contact.subtitle')}
        </span>
        <h1 className="text-4xl sm:text-5xl font-bold text-[#111111]">
          {t('contact.title')}
        </h1>
      </section>
      {/* Info Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="flex flex-col items-center justify-center p-6 rounded-3xl bg-white border border-[#CBC4B6] shadow-luxury h-full min-h-[160px] text-center space-y-3">
          <MapPin className="w-6 h-6 text-[#B99246] mb-1" />
          <h3 className="font-bold text-xs uppercase tracking-wider text-[#111111]">{t('contact.address')}</h3>
          <a href={HOTEL.googleMapsUrl} target="_blank" rel="noreferrer" className="text-xs text-[#333333]/80 hover:text-[#B99246] block">{HOTEL.address}</a>
        </div>

        <div className="flex flex-col items-center justify-center p-6 rounded-3xl bg-white border border-[#CBC4B6] shadow-luxury h-full min-h-[160px] text-center space-y-3">
          <Phone className="w-6 h-6 text-[#B99246] mb-1" />
          <h3 className="font-bold text-xs uppercase tracking-wider text-[#111111]">{t('contact.phone')}</h3>
          <PhoneNumber action={HOTEL.phone} display={HOTEL.phoneDisplay} className="text-xs text-[#333333]/80 hover:text-[#B99246] block" />
        </div>

        <div className="flex flex-col items-center justify-center p-6 rounded-3xl bg-white border border-[#CBC4B6] shadow-luxury h-full min-h-[160px] text-center space-y-3">
          <FaWhatsapp className="w-6 h-6 text-[#B99246] mb-1" />
          <h3 className="font-bold text-xs uppercase tracking-wider text-[#111111]">{t('contact.whatsapp')}</h3>
          <PhoneNumber action={`https://wa.me/${HOTEL.whatsapp.replace('+', '')}`} display={HOTEL.whatsappDisplay} className="text-xs text-[#333333]/80 hover:text-[#B99246] block" />
        </div>

        <div className="flex flex-col items-center justify-center p-6 rounded-3xl bg-white border border-[#CBC4B6] shadow-luxury h-full min-h-[160px] text-center space-y-3">
          <Mail className="w-6 h-6 text-[#B99246] mb-1" />
          <h3 className="font-bold text-xs uppercase tracking-wider text-[#111111]">{t('contact.email')}</h3>
          <a href={`mailto:${HOTEL.email}`} className="text-xs text-[#333333]/80 hover:text-[#B99246] block">{HOTEL.email}</a>
        </div>
      </section>

      {/* Social Networks */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
        <h3 className="text-xs font-bold text-[#B99246] uppercase tracking-widest">
          {t('common.footer.followUs')}
        </h3>
        <div className="flex items-center justify-center gap-3">
          <a
            href={HOTEL.socials.instagram}
            target="_blank"
            rel="noreferrer"
            className="w-11 h-11 rounded-full bg-white border border-[#CBC4B6] shadow-luxury flex items-center justify-center text-[#B99246] hover:bg-[#B99246] hover:text-white hover:border-[#B99246] transition-all"
            aria-label="Instagram"
          >
            <FaInstagram className="w-4 h-4" />
          </a>
          <a
            href={HOTEL.socials.facebook}
            target="_blank"
            rel="noreferrer"
            className="w-11 h-11 rounded-full bg-white border border-[#CBC4B6] shadow-luxury flex items-center justify-center text-[#B99246] hover:bg-[#B99246] hover:text-white hover:border-[#B99246] transition-all"
            aria-label="Facebook"
          >
            <FaFacebook className="w-4 h-4" />
          </a>
          <a
            href={HOTEL.socials.tiktok}
            target="_blank"
            rel="noreferrer"
            className="w-11 h-11 rounded-full bg-white border border-[#CBC4B6] shadow-luxury flex items-center justify-center text-[#B99246] hover:bg-[#B99246] hover:text-white hover:border-[#B99246] transition-all"
            aria-label="TikTok"
          >
            <FaTiktok className="w-4 h-4" />
          </a>
        </div>
      </section>

      {/* Booking Form & Map Section */}
      <section id="booking" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7">
          <Suspense fallback={<BookingForm />}>
            <ContactBookingForm />
          </Suspense>
        </div>
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="h-full min-h-[400px] rounded-3xl overflow-hidden border border-[#CBC4B6] shadow-luxury relative bg-[#111111]">
            <iframe
              src={HOTEL.googleMapsEmbedUrl}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              title={`${HOTEL.name} Map`}
            />
          </div>
          <a
            href={HOTEL.googleMapsUrl}
            target="_blank"
            rel="noreferrer"
            className="h-12 rounded-2xl bg-[#B99246] text-[#111111] font-bold text-xs uppercase tracking-widest hover:bg-[#D4AF37] transition-all shadow-luxury flex items-center justify-center gap-2"
          >
            <MapPin className="w-4 h-4" />
            <span>{t('contact.openMap')}</span>
          </a>
        </div>
      </section>
    </div>
  );
}
