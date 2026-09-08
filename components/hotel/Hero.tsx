'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/components/providers/LanguageContext';
import { Calendar, ChevronDown, Star } from 'lucide-react';
import { HOTEL } from '@/config/hotel';

export const Hero: React.FC = () => {
  const { t } = useLanguage();

  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = [
    '/images/hero/hotel-entrance.webp',
    '/images/hero/hotel-lobby.webp'
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#111111] text-white">
      {/* Background Slideshow */}
      <div className="absolute inset-0 z-0">
        <AnimatePresence>
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
            className="absolute inset-0"
          >
            <Image
              src={slides[currentSlide]}
              alt={`${HOTEL.name} Hero`}
              fill
              sizes="100vw"
              className="object-cover"
              priority={currentSlide === 0}
            />
          </motion.div>
        </AnimatePresence>
        {/* Luxury Dark Overlay */}
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Hero Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 text-center space-y-6 pt-24 pb-16">
        {/* Stars Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex flex-col items-center gap-2 px-6 py-3 rounded-2xl bg-white/5 border border-[#B99246]/40 backdrop-blur-md text-[#B99246] font-bold uppercase tracking-widest"
        >
          <span className="text-base sm:text-lg">{t('common.stars')}</span>
          <div className="flex gap-1 text-[#B99246]">
            {[...Array(4)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-[#B99246]" />
            ))}
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-tight"
        >
          {t('home.hero.title')}
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-sm sm:text-lg max-w-2xl mx-auto text-white/80 font-light leading-relaxed"
        >
          {t('home.hero.subtitle')}
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            href="/contact#booking"
            className="w-full sm:w-auto px-8 py-4 rounded-full bg-[#B99246] text-[#111111] font-bold text-xs uppercase tracking-widest hover:bg-[#D4AF37] shadow-xl shadow-[#B99246]/20 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            <span>{t('home.hero.ctaBooking')}</span>
          </Link>
          <Link
            href="/rooms"
            className="w-full sm:w-auto px-8 py-4 rounded-full bg-white/10 border border-white/20 text-white font-semibold text-xs uppercase tracking-widest hover:bg-white/20 transition-all backdrop-blur-sm"
          >
            <span>{t('home.hero.ctaExplore')}</span>
          </Link>
        </motion.div>
      </div>

      {/* Smooth Scroll Indicator */}
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/50 hover:text-[#B99246] transition-colors"
      >
        <ChevronDown className="w-6 h-6" />
      </motion.div>
    </section>
  );
};
