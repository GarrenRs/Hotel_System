'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/components/providers/LanguageContext';
import { HOTEL } from '@/config/hotel';
import { NAV_ITEMS } from '@/lib/constants';
import { MapPin, Phone, Mail } from 'lucide-react';
import { FaInstagram, FaFacebook } from 'react-icons/fa';
import { PhoneNumber } from '@/components/ui/PhoneNumber';

export const Footer: React.FC = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-[#111111] text-white/80 border-t border-[#B99246]/20 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="relative w-48 h-14">
              <Image
                src="/images/logo/logo.png"
                alt={HOTEL.fullName}
                fill
                sizes="200px"
                className="object-contain"
              />
            </div>
            <p className="text-xs leading-relaxed text-white/70">
              {t('common.footer.aboutDesc')}
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a
                href={HOTEL.socials.instagram}
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full bg-white/5 border border-[#B99246]/30 flex items-center justify-center text-[#B99246] hover:bg-[#B99246] hover:text-[#111111] transition-all"
                aria-label="Instagram"
              >
                <FaInstagram className="w-4 h-4" />
              </a>
              <a
                href={HOTEL.socials.facebook}
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full bg-white/5 border border-[#B99246]/30 flex items-center justify-center text-[#B99246] hover:bg-[#B99246] hover:text-[#111111] transition-all"
                aria-label="Facebook"
              >
                <FaFacebook className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-bold text-[#B99246] uppercase tracking-wider mb-4">
              {t('common.footer.quickLinks')}
            </h3>
            <ul className="space-y-2.5 text-xs">
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="hover:text-[#B99246] transition-colors"
                  >
                    {t(`common.${item.labelKey}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h3 className="text-sm font-bold text-[#B99246] uppercase tracking-wider mb-4">
              {t('common.footer.contactInfo')}
            </h3>
            <ul className="space-y-3 text-xs">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-[#B99246] shrink-0 mt-0.5" />
                <a href={HOTEL.googleMapsUrl} target="_blank" rel="noreferrer" className="hover:text-[#B99246] transition-colors">{HOTEL.address}</a>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-[#B99246] shrink-0" />
                <PhoneNumber action={HOTEL.phone} display={HOTEL.phoneDisplay} className="hover:text-[#B99246] transition-colors" />
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-[#B99246] shrink-0" />
                <a href={`mailto:${HOTEL.email}`} className="hover:text-[#B99246] transition-colors">{HOTEL.email}</a>
              </li>
            </ul>
          </div>

          {/* Hours & Luxury Badge */}
          <div className="bg-white/5 border border-[#B99246]/20 p-6 rounded-3xl space-y-3">
            <h4 className="text-xs font-bold text-[#B99246] uppercase tracking-widest">
              {t('common.footer.checkInCheckOut')}
            </h4>
            <div className="text-xs space-y-1 text-white/80">
              <p>{t('common.footer.checkIn')}: <span className="font-semibold text-white">{HOTEL.checkIn}</span></p>
              <p>{t('common.footer.checkOut')}: <span className="font-semibold text-white">{HOTEL.checkOut}</span></p>
            </div>
            <div className="pt-2 border-t border-white/10 text-[11px] text-[#B99246] font-medium">
              {t('common.footer.standard')}
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 text-center text-xs text-white/50">
          {t('common.footer.rights')}
        </div>
      </div>
    </footer>
  );
};
