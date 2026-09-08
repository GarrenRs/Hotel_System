import { RoomType, ReservationStatus } from '@/domain/reservation/enums';
import { RoomStatus } from '@/domain/room/enums';

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

export const STATUS_CONFIG: Record<ReservationStatus, { labelKey: string; color: string; badgeBg: string; badgeText: string; icon: string }> = {
  [ReservationStatus.NEW]: {
    labelKey: 'status.new',
    color: '#3B82F6',
    badgeBg: 'bg-blue-500/10 text-blue-600 border-blue-200',
    badgeText: '🔵 New',
    icon: 'Sparkles',
  },
  [ReservationStatus.PENDING]: {
    labelKey: 'status.pending',
    color: '#EAB308',
    badgeBg: 'bg-amber-500/10 text-amber-600 border-amber-200',
    badgeText: '🟡 Pending',
    icon: 'Clock',
  },
  [ReservationStatus.CONFIRMED]: {
    labelKey: 'status.confirmed',
    color: '#22C55E',
    badgeBg: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
    badgeText: '🟢 Confirmed',
    icon: 'CheckCircle2',
  },
  [ReservationStatus.CANCELLED]: {
    labelKey: 'status.cancelled',
    color: '#EF4444',
    badgeBg: 'bg-rose-500/10 text-rose-600 border-rose-200',
    badgeText: '🔴 Cancelled',
    icon: 'XCircle',
  },
};

export const ROOM_STATUS_CONFIG: Record<RoomStatus, { labelKey: string; color: string; badgeBg: string; badgeText: string; icon: string }> = {
  [RoomStatus.AVAILABLE]: {
    labelKey: 'status.available',
    color: '#22C55E',
    badgeBg: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
    badgeText: '🟢 Available',
    icon: 'CheckCircle2',
  },
  [RoomStatus.OCCUPIED]: {
    labelKey: 'status.occupied',
    color: '#3B82F6',
    badgeBg: 'bg-blue-500/10 text-blue-600 border-blue-200',
    badgeText: '🔵 Occupied',
    icon: 'DoorOpen',
  },
  [RoomStatus.CLEANING]: {
    labelKey: 'status.cleaning',
    color: '#EAB308',
    badgeBg: 'bg-amber-500/10 text-amber-600 border-amber-200',
    badgeText: '🟡 Cleaning',
    icon: 'Sparkles',
  },
  [RoomStatus.MAINTENANCE]: {
    labelKey: 'status.maintenance',
    color: '#EF4444',
    badgeBg: 'bg-rose-500/10 text-rose-600 border-rose-200',
    badgeText: '🔴 Maintenance',
    icon: 'Wrench',
  },
};

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
