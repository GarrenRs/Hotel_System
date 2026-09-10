import type { Metadata } from 'next';
import { cairo, poppins } from '@/lib/fonts';
import { LanguageProvider } from '@/components/providers/LanguageContext';
import { HOTEL } from '@/config/hotel';
import { ROOM_TYPES_LIST } from '@/lib/constants';
import './globals.css';

const prices = ROOM_TYPES_LIST.map((roomType) => roomType.priceDZD);
const minPrice = Math.min(...prices);
const maxPrice = Math.max(...prices);

export const metadata: Metadata = {
  title: {
    default: `${HOTEL.name} - Luxury 4-Star Hotel in Sidi Moussa, Algiers`,
    template: `%s | ${HOTEL.name}`,
  },
  description: `${HOTEL.name} (${HOTEL.fullName}) is a luxury four-star hotel located in Sidi Moussa, Algiers, Algeria. Offering premium suites, gourmet dining, swimming pool, fitness center, and royal wedding halls.`,
  keywords: [
    HOTEL.name,
    HOTEL.fullName,
    'Sidi Moussa Luxury Hotel',
    'Hotel Bouteldja Sidi Moussa',
    'Hotel 4 etoiles Algerie',
    'Hotel a Sidi Moussa',
    'Chambres et suites a Sidi Moussa',
    'فندق بوثلجة سيدي موسى',
    'حجز فندق سيدي موسى',
  ],
  authors: [{ name: HOTEL.fullName }],
  metadataBase: new URL('https://hotel-hb.dz'),
  openGraph: {
    type: 'website',
    locale: 'ar_DZ',
    url: 'https://hotel-hb.dz',
    title: `${HOTEL.name} - Luxury 4-Star Hotel`,
    description: `Experience prestige, elegance, and peace at ${HOTEL.name} in Sidi Moussa, Algiers.`,
    siteName: HOTEL.name,
    images: [
      {
        url: '/images/hero/hero-bg.svg',
        width: 1200,
        height: 630,
        alt: HOTEL.fullName,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${HOTEL.name} - Luxury 4-Star Hotel`,
    description: `Luxury hospitality in Sidi Moussa, Algiers.`,
    images: ['/images/hero/hero-bg.svg'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Hotel',
    name: HOTEL.fullName,
    alternateName: HOTEL.name,
    image: 'https://hotel-hb.dz/images/hero/hero-bg.svg',
    starRating: {
      '@type': 'Rating',
      ratingValue: '4',
    },
    address: {
      '@type': 'PostalAddress',
      streetAddress: HOTEL.address,
      addressLocality: 'Sidi Moussa',
      addressRegion: 'Algiers',
      addressCountry: 'DZ',
    },
    telephone: HOTEL.phone,
    email: HOTEL.email,
    checkinTime: HOTEL.checkIn,
    checkoutTime: HOTEL.checkOut,
    priceRange: `${minPrice} DZD - ${maxPrice} DZD`,
  };

  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} ${poppins.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="bg-hotel-bg text-[#333333] antialiased selection:bg-[#B99246] selection:text-[#111111]">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
