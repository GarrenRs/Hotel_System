'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/components/providers/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Menu, X, Calendar, ChevronDown, Utensils, Waves, Dumbbell, HeartHandshake } from 'lucide-react';
import { HOTEL } from '@/config/hotel';

export const Header: React.FC = () => {
  const { t } = useLanguage();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [servicesDropdownOpen, setServicesDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setServicesDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const serviceItems = [
    { href: '/restaurant', labelKey: 'common.nav.restaurant', icon: Utensils },
    { href: '/pool', labelKey: 'common.nav.pool', icon: Waves },
    { href: '/gym', labelKey: 'common.nav.gym', icon: Dumbbell },
    { href: '/wedding', labelKey: 'common.nav.wedding', icon: HeartHandshake },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 glass-header border-b border-[#B99246]/20 ${
        isScrolled ? 'py-3 shadow-luxury' : 'py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-40 sm:w-44 h-12">
            <Image
              src="/images/logo/logo.png"
              alt={`${HOTEL.name} Logo`}
              fill
              sizes="120px"
              className="object-contain transition-transform duration-300 group-hover:scale-105"
              priority
            />
          </div>
        </Link>

        {/* Desktop Navigation - Simplified */}
        <nav className="hidden lg:flex items-center gap-7">
          {/* Home */}
          <Link
            href="/"
            className="text-xs font-semibold text-white/90 hover:text-[#B99246] tracking-wider transition-colors uppercase py-1"
          >
            {t('common.nav.home')}
          </Link>

          {/* Rooms */}
          <Link
            href="/rooms"
            className="text-xs font-semibold text-white/90 hover:text-[#B99246] tracking-wider transition-colors uppercase py-1"
          >
            {t('common.nav.rooms')}
          </Link>

          {/* Services Dropdown */}
          <div
            className="relative"
            ref={dropdownRef}
            onMouseEnter={() => setServicesDropdownOpen(true)}
            onMouseLeave={() => setServicesDropdownOpen(false)}
          >
            <button
              onClick={() => setServicesDropdownOpen(!servicesDropdownOpen)}
              className="flex items-center gap-1.5 text-xs font-semibold text-white/90 hover:text-[#B99246] tracking-wider transition-colors uppercase py-1 cursor-pointer"
            >
              <span>{t('common.nav.services')}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${servicesDropdownOpen ? 'rotate-180 text-[#B99246]' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {servicesDropdownOpen && (
              <div className="absolute top-full start-0 mt-2 w-56 glass-header border border-[#B99246]/30 rounded-2xl p-2 shadow-2xl animate-fadeIn space-y-1">
                {serviceItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setServicesDropdownOpen(false)}
                      className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs text-white/90 hover:text-[#B99246] hover:bg-white/10 transition-all font-medium"
                    >
                      <Icon className="w-4 h-4 text-[#B99246]" />
                      <span>{t(item.labelKey)}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Gallery */}
          <Link
            href="/gallery"
            className="text-xs font-semibold text-white/90 hover:text-[#B99246] tracking-wider transition-colors uppercase py-1"
          >
            {t('common.nav.gallery')}
          </Link>

          {/* Contact */}
          <Link
            href="/contact"
            className="text-xs font-semibold text-white/90 hover:text-[#B99246] tracking-wider transition-colors uppercase py-1"
          >
            {t('common.nav.contact')}
          </Link>
        </nav>

        {/* Right CTA & Switcher */}
        <div className="hidden lg:flex items-center gap-4">
          <LanguageSwitcher />
          <Link
            href="/contact#booking"
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#B99246] text-[#111111] font-bold text-xs uppercase tracking-wider hover:bg-[#D4AF37] shadow-lg shadow-[#B99246]/20 transition-all duration-300 hover:scale-105 active:scale-95"
          >
            <Calendar className="w-4 h-4" />
            <span>{t('common.reserveNow')}</span>
          </Link>
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="flex lg:hidden items-center gap-3">
          <LanguageSwitcher />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-white hover:text-[#B99246] transition-colors cursor-pointer"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden glass-header border-b border-[#B99246]/20 px-6 py-6 transition-all animate-fadeIn space-y-3">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-white hover:text-[#B99246] transition-colors py-2 border-b border-white/10"
          >
            {t('common.nav.home')}
          </Link>

          <Link
            href="/rooms"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-white hover:text-[#B99246] transition-colors py-2 border-b border-white/10"
          >
            {t('common.nav.rooms')}
          </Link>

          {/* Mobile Services Accordion */}
          <div className="py-2 border-b border-white/10 space-y-2">
            <div className="text-xs font-bold text-[#B99246] uppercase tracking-wider">
              {t('common.nav.services')}
            </div>
            <div className="ps-4 space-y-2">
              {serviceItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-xs font-medium text-white/80 hover:text-[#B99246] py-1"
                >
                  {t(item.labelKey)}
                </Link>
              ))}
            </div>
          </div>

          <Link
            href="/gallery"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-white hover:text-[#B99246] transition-colors py-2 border-b border-white/10"
          >
            {t('common.nav.gallery')}
          </Link>

          <Link
            href="/contact"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-white hover:text-[#B99246] transition-colors py-2 border-b border-white/10"
          >
            {t('common.nav.contact')}
          </Link>

          <Link
            href="/contact#booking"
            onClick={() => setMobileMenuOpen(false)}
            className="mt-4 flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-[#B99246] text-[#111111] font-bold text-xs uppercase tracking-wider shadow-lg"
          >
            <Calendar className="w-4 h-4" />
            <span>{t('common.reserveNow')}</span>
          </Link>
        </div>
      )}
    </header>
  );
};
