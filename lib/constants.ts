import { RoomType } from '@/domain/reservation/enums';

export const ROOM_TYPES_LIST = [
  {
    id: RoomType.DELUXE_SUITE,
    key: 'deluxeSuite',
    priceDZD: 24500,
    area: '45 m²',
    capacity: 2,
    image: '/images/rooms/room-standard-double.webp',
  },
  {
    id: RoomType.EXECUTIVE_SUITE,
    key: 'executiveSuite',
    priceDZD: 34500,
    area: '65 m²',
    capacity: 3,
    image: '/images/rooms/room-standard-double.webp',
  },
  {
    id: RoomType.ROYAL_SUITE,
    key: 'royalSuite',
    priceDZD: 59000,
    area: '110 m²',
    capacity: 4,
    image: '/images/rooms/room-standard-double.webp',
  },
  {
    id: RoomType.STANDARD_DOUBLE,
    key: 'standardDouble',
    priceDZD: 17500,
    area: '32 m²',
    capacity: 2,
    image: '/images/rooms/room-standard-double.webp',
  },
  {
    id: RoomType.FAMILY_SUITE,
    key: 'familySuite',
    priceDZD: 41500,
    area: '80 m²',
    capacity: 5,
    image: '/images/rooms/room-standard-twin.webp',
  },
];

export const NAV_ITEMS = [
  { href: '/', labelKey: 'nav.home' },
  { href: '/about', labelKey: 'nav.about' },
  { href: '/rooms', labelKey: 'nav.rooms' },
  { href: '/restaurant', labelKey: 'nav.restaurant' },
  { href: '/pool', labelKey: 'nav.pool' },
  { href: '/gym', labelKey: 'nav.gym' },
  { href: '/wedding', labelKey: 'nav.wedding' },
  { href: '/gallery', labelKey: 'nav.gallery' },
  { href: '/contact', labelKey: 'nav.contact' },
];
