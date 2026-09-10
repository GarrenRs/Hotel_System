'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { X, Maximize2 } from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageContext';

const galleryImages = [
  { id: 1, src: '/images/hero/hotel-lobby.webp', titleKey: 'common.gallery.captionLobby' },
  { id: 2, src: '/images/rooms/room-standard-twin.webp', titleKey: 'common.gallery.captionTwinRoom' },
  { id: 3, src: '/images/restaurant/hotel-restaurant-dining.webp', titleKey: 'common.gallery.captionRestaurant' },
  { id: 4, src: '/images/pool/hotel-pool.webp', titleKey: 'common.gallery.captionPool' },
  { id: 5, src: '/images/restaurant/hotel-restaurant-breakfast.webp', titleKey: 'common.gallery.captionBreakfast' },
  { id: 6, src: '/images/conference/hotel-conference-room.webp', titleKey: 'common.gallery.captionConference' },
];

export const GalleryGrid: React.FC = () => {
  const { t } = useLanguage();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  return (
    <div>
      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {galleryImages.map((img) => (
          <div
            key={img.id}
            onClick={() => setSelectedImage(img.src)}
            className="relative h-72 rounded-3xl overflow-hidden bg-[#111111] cursor-pointer group border border-[#CBC4B6] shadow-luxury"
          >
            <Image
              src={img.src}
              alt={t(img.titleKey)}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#111111]/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
              <div className="flex items-center justify-between w-full text-white">
                <span className="text-sm font-bold">{t(img.titleKey)}</span>
                <Maximize2 className="w-5 h-5 text-[#B99246]" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          className="fixed inset-0 z-50 bg-[#111111]/95 backdrop-blur-xl flex items-center justify-center p-4 sm:p-10 animate-fadeIn"
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-6 right-6 p-3 rounded-full bg-white/10 text-white hover:text-[#B99246] hover:bg-white/20 transition-all cursor-pointer"
            aria-label="Close Lightbox"
          >
            <X className="w-6 h-6" />
          </button>
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-5xl h-[80vh] rounded-3xl overflow-hidden border border-[#B99246]/30 shadow-2xl"
          >
            <Image
              src={selectedImage}
              alt="Gallery Preview"
              fill
              sizes="100vw"
              className="object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
};
