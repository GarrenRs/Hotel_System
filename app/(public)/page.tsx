'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Hero } from '@/components/hotel/Hero';
import { BookingForm } from '@/components/reservation/BookingForm';
import { RoomCard } from '@/components/hotel/RoomCard';
import { GalleryGrid } from '@/components/hotel/GalleryGrid';
import { StatsBand } from '@/components/hotel/StatsBand';
import { useLanguage } from '@/components/providers/LanguageContext';
import { ROOM_TYPES_LIST } from '@/lib/constants';
import { HOTEL } from '@/config/hotel';
import { Utensils, Waves, Dumbbell, HeartHandshake, Wifi, Car, ArrowRight, Star, MapPin, Phone, Mail } from 'lucide-react';
import { PhoneNumber } from '@/components/ui/PhoneNumber';

export default function HomePage() {
  const { t } = useLanguage();

  return (
    <div className="space-y-24 pb-20 text-start">
      {/* Hero Section */}
      <Hero />

      {/* Booking Form Section */}
      <section id="booking" className="max-w-6xl mx-auto px-4 sm:px-6 -mt-20 relative z-20">
        <BookingForm />
      </section>

      {/* About Hotel Short Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#B99246]/10 text-[#B99246] text-xs font-bold uppercase tracking-wider">
              <span>{t('home.aboutShort.subtitle')}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#111111] leading-tight">
              {t('home.aboutShort.title')}
            </h2>
            <p className="text-sm sm:text-base text-[#333333]/80 leading-relaxed">
              {t('home.aboutShort.description')}
            </p>
            <div className="pt-4 flex gap-4">
              <Link
                href="/about"
                className="px-6 py-3 rounded-full bg-[#111111] text-[#B99246] font-bold text-xs uppercase tracking-wider hover:bg-[#B99246] hover:text-[#111111] transition-all flex items-center gap-2"
              >
                <span>{t('common.exploreMore')}</span>
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </Link>
            </div>
          </div>

          <div className="relative h-80 sm:h-96 rounded-3xl overflow-hidden border border-[#EAEAEA] shadow-luxury bg-[#111111]">
            <Image
              src="/images/hero/hotel-lobby.webp"
              alt={HOTEL.fullName}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#111111]/70 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 p-6 rounded-2xl glass-card text-[#111111]">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-base">{HOTEL.name}</h4>
                  <p className="text-xs text-[#333333]/70">{HOTEL.location}</p>
                </div>
                <div className="flex gap-1 text-[#B99246]">
                  {[...Array(4)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-[#B99246]" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Luxury Amenities Grid */}
      <section className="bg-[#111111] text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-bold text-[#B99246] uppercase tracking-widest">
              {t('home.amenities.title')}
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              {t('home.amenities.subtitle')}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-white/5 border border-[#B99246]/20 hover:border-[#B99246] transition-all space-y-4">
              <Utensils className="w-8 h-8 text-[#B99246]" />
              <h3 className="text-lg font-bold text-white">{t('common.nav.restaurant')}</h3>
              <p className="text-xs text-white/70">{t('home.amenities.restaurant')}</p>
            </div>

            <div className="p-8 rounded-3xl bg-white/5 border border-[#B99246]/20 hover:border-[#B99246] transition-all space-y-4">
              <Waves className="w-8 h-8 text-[#B99246]" />
              <h3 className="text-lg font-bold text-white">{t('common.nav.pool')}</h3>
              <p className="text-xs text-white/70">{t('home.amenities.pool')}</p>
            </div>

            <div className="p-8 rounded-3xl bg-white/5 border border-[#B99246]/20 hover:border-[#B99246] transition-all space-y-4">
              <Dumbbell className="w-8 h-8 text-[#B99246]" />
              <h3 className="text-lg font-bold text-white">{t('common.nav.gym')}</h3>
              <p className="text-xs text-white/70">{t('home.amenities.gym')}</p>
            </div>

            <div className="p-8 rounded-3xl bg-white/5 border border-[#B99246]/20 hover:border-[#B99246] transition-all space-y-4">
              <HeartHandshake className="w-8 h-8 text-[#B99246]" />
              <h3 className="text-lg font-bold text-white">{t('common.nav.wedding')}</h3>
              <p className="text-xs text-white/70">{t('home.amenities.wedding')}</p>
            </div>

            <div className="p-8 rounded-3xl bg-white/5 border border-[#B99246]/20 hover:border-[#B99246] transition-all space-y-4">
              <Wifi className="w-8 h-8 text-[#B99246]" />
              <h3 className="text-lg font-bold text-white">{t('home.amenities.wifi')}</h3>
              <p className="text-xs text-white/70">{t('home.amenities.wifi')}</p>
            </div>

            <div className="p-8 rounded-3xl bg-white/5 border border-[#B99246]/20 hover:border-[#B99246] transition-all space-y-4">
              <Car className="w-8 h-8 text-[#B99246]" />
              <h3 className="text-lg font-bold text-white">{t('home.amenities.parking')}</h3>
              <p className="text-xs text-white/70">{t('home.amenities.parking')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Rooms Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <span className="text-xs font-bold text-[#B99246] uppercase tracking-widest">
              {t('rooms.subtitle')}
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#111111]">
              {t('rooms.title')}
            </h2>
          </div>
          <Link
            href="/rooms"
            className="text-xs font-bold text-[#B99246] hover:text-[#8C6D27] uppercase tracking-wider flex items-center gap-1"
          >
            <span>{t('common.exploreMore')}</span>
            <ArrowRight className="w-4 h-4 rtl:rotate-180" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {ROOM_TYPES_LIST.slice(0, 3).map((room) => (
            <RoomCard
              key={room.id}
              roomKey={room.key}
              image={room.image}
              priceDZD={room.priceDZD}
              area={room.area}
              capacity={room.capacity}
            />
          ))}
        </div>
      </section>

      {/* Gallery Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold text-[#B99246] uppercase tracking-widest">
            {t('common.nav.gallery')}
          </span>
          <h2 className="text-3xl font-bold text-[#111111]">
            {t('common.hotelName')}
          </h2>
        </div>
        <GalleryGrid />
      </section>

      {/* Statistics Section */}
      <section className="bg-[#111111] text-white py-16 border-y border-[#B99246]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          <StatsBand />
        </div>
      </section>

      {/* Contact Section Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-[#EAEAEA] shadow-luxury grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-6">
            <span className="text-xs font-bold text-[#B99246] uppercase tracking-widest">
              {t('contact.title')}
            </span>
            <h2 className="text-3xl font-bold text-[#111111]">
              {t('contact.subtitle')}
            </h2>
            <div className="space-y-4 text-xs sm:text-sm text-[#333333]">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-[#B99246]" />
                <a href={HOTEL.googleMapsUrl} target="_blank" rel="noreferrer" className="hover:text-[#B99246] transition-colors">{HOTEL.address}</a>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-[#B99246]" />
                <PhoneNumber action={HOTEL.phone} display={HOTEL.phoneDisplay} className="hover:text-[#B99246] transition-colors" />
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-[#B99246]" />
                <a href={`mailto:${HOTEL.email}`} className="hover:text-[#B99246] transition-colors">{HOTEL.email}</a>
              </div>
            </div>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#B99246] text-[#111111] font-bold text-xs uppercase tracking-wider hover:bg-[#D4AF37] transition-all"
            >
              <span>{t('common.contactUs')}</span>
              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </Link>
          </div>

          <div className="h-72 rounded-2xl overflow-hidden border border-[#EAEAEA] relative">
            <iframe
              src={HOTEL.googleMapsEmbedUrl}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              title={`${HOTEL.name} Google Map Location`}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
