import { ReservationStatus } from '@/domain/reservation/enums';
import { RoomStatus } from '@/domain/room/enums';

/**
 * Single source of truth for status presentation (labels / colors / icons)
 * and for the legal transition table of each enum (ST-001 §L6).
 * Consumed by StatusBadge, the room/reservation admin pages, and the service
 * layer. No other status->presentation map may exist.
 */

export interface StatusUiConfig {
  labelKey: string;
  color: string;
  badgeBg: string;
  dot: string;
  icon: string;
}

export const RESERVATION_STATUS_UI: Record<ReservationStatus, StatusUiConfig> = {
  [ReservationStatus.NEW]: {
    labelKey: 'common.status.new',
    color: '#3B82F6',
    badgeBg: 'bg-blue-500/10 text-blue-600 border-blue-200',
    dot: '🔵',
    icon: 'Sparkles',
  },
  [ReservationStatus.CONFIRMED]: {
    labelKey: 'common.status.confirmed',
    color: '#22C55E',
    badgeBg: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
    dot: '🟢',
    icon: 'CheckCircle2',
  },
  [ReservationStatus.CHECKED_IN]: {
    labelKey: 'common.status.checkedIn',
    color: '#8B5CF6',
    badgeBg: 'bg-violet-500/10 text-violet-600 border-violet-200',
    dot: '🟣',
    icon: 'DoorOpen',
  },
  [ReservationStatus.CHECKED_OUT]: {
    labelKey: 'common.status.checkedOut',
    color: '#64748B',
    badgeBg: 'bg-slate-500/10 text-slate-600 border-slate-200',
    dot: '⚪',
    icon: 'KeyRound',
  },
  [ReservationStatus.CANCELLED]: {
    labelKey: 'common.status.cancelled',
    color: '#EF4444',
    badgeBg: 'bg-rose-500/10 text-rose-600 border-rose-200',
    dot: '🔴',
    icon: 'XCircle',
  },
};

// Explicit handling for an unknown status: never silently fall back to an
// existing state label.
export const UNKNOWN_STATUS_UI: StatusUiConfig = {
  labelKey: 'common.status.unknown',
  color: '#64748B',
  badgeBg: 'bg-slate-100 text-slate-600 border-slate-300',
  dot: '⬜',
  icon: 'HelpCircle',
};

export const ROOM_STATUS_UI: Record<RoomStatus, StatusUiConfig> = {
  [RoomStatus.AVAILABLE]: {
    labelKey: 'common.status.available',
    color: '#22C55E',
    badgeBg: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
    dot: '🟢',
    icon: 'CheckCircle2',
  },
  [RoomStatus.OCCUPIED]: {
    labelKey: 'common.status.occupied',
    color: '#3B82F6',
    badgeBg: 'bg-blue-500/10 text-blue-600 border-blue-200',
    dot: '🔵',
    icon: 'DoorOpen',
  },
  [RoomStatus.CLEANING]: {
    labelKey: 'common.status.cleaning',
    color: '#EAB308',
    badgeBg: 'bg-amber-500/10 text-amber-600 border-amber-200',
    dot: '🟡',
    icon: 'Sparkles',
  },
  [RoomStatus.MAINTENANCE]: {
    labelKey: 'common.status.maintenance',
    color: '#EF4444',
    badgeBg: 'bg-rose-500/10 text-rose-600 border-rose-200',
    dot: '🔴',
    icon: 'Wrench',
  },
};

export function reservationStatusUi(status: ReservationStatus | string): StatusUiConfig {
  return RESERVATION_STATUS_UI[status as ReservationStatus] ?? UNKNOWN_STATUS_UI;
}

export function roomStatusUi(status: RoomStatus | string): StatusUiConfig {
  return ROOM_STATUS_UI[status as RoomStatus] ?? UNKNOWN_STATUS_UI;
}

// Legal transition tables (single source of truth for the state machines).
// PENDING is removed; CONFIRMED -> NEW does not exist (ST-001 review decision 2).

export const RESERVATION_TRANSITIONS: Record<ReservationStatus, ReservationStatus[]> = {
  [ReservationStatus.NEW]: [ReservationStatus.CONFIRMED, ReservationStatus.CANCELLED],
  [ReservationStatus.CONFIRMED]: [ReservationStatus.CHECKED_IN, ReservationStatus.CANCELLED],
  [ReservationStatus.CHECKED_IN]: [ReservationStatus.CHECKED_OUT],
  [ReservationStatus.CHECKED_OUT]: [],
  [ReservationStatus.CANCELLED]: [],
};

export const ROOM_TRANSITIONS: Record<RoomStatus, RoomStatus[]> = {
  // Manual operational toggles only (ST-001 §G/H): no manual OCCUPIED,
  // no AVAILABLE->CLEANING exposed, nothing while occupied.
  [RoomStatus.AVAILABLE]: [RoomStatus.MAINTENANCE],
  [RoomStatus.OCCUPIED]: [],
  [RoomStatus.CLEANING]: [RoomStatus.AVAILABLE, RoomStatus.MAINTENANCE],
  [RoomStatus.MAINTENANCE]: [RoomStatus.AVAILABLE],
};

// Human-facing label for a transition edge (consumed by the admin pages so the
// buttons are never hardcoded).
export const TRANSITION_LABEL_KEYS: Record<string, string> = {
  [`${ReservationStatus.NEW}>${ReservationStatus.CONFIRMED}`]: 'admin.actions.confirm',
  [`${ReservationStatus.NEW}>${ReservationStatus.CANCELLED}`]: 'admin.actions.cancel',
  [`${ReservationStatus.CONFIRMED}>${ReservationStatus.CHECKED_IN}`]: 'admin.actions.checkIn',
  [`${ReservationStatus.CONFIRMED}>${ReservationStatus.CANCELLED}`]: 'admin.actions.cancel',
  [`${ReservationStatus.CHECKED_IN}>${ReservationStatus.CHECKED_OUT}`]: 'admin.actions.checkOut',
  [`${RoomStatus.CLEANING}>${RoomStatus.AVAILABLE}`]: 'admin.actions.markReady',
  [`${RoomStatus.MAINTENANCE}>${RoomStatus.AVAILABLE}`]: 'admin.actions.backToService',
  [`${RoomStatus.AVAILABLE}>${RoomStatus.MAINTENANCE}`]: 'admin.actions.maintenance',
  [`${RoomStatus.CLEANING}>${RoomStatus.MAINTENANCE}`]: 'admin.actions.maintenance',
};

export function transitionLabelKey(from: ReservationStatus | string, to: ReservationStatus | string): string {
  return TRANSITION_LABEL_KEYS[`${from}>${to}`] ?? 'common.status.unknown';
}