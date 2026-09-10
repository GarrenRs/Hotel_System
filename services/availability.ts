import { ReservationStatus } from '@/domain/reservation/enums';
import { RoomStatus } from '@/domain/room/enums';
import { RoomEntity } from '@/domain/room/entities';
import { ReservationEntity } from '@/domain/reservation/entities';

/**
 * Shared service-layer availability logic (ST-001 §E, authoritative).
 * Reused by: the guest form (GET /api/rooms/available), reservation creation,
 * confirm, and check-in. No availability logic lives in the UI.
 */

export interface Period {
  arrivalDate: string;
  departureDate: string;
}

export function isoToday(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function periodsOverlap(a: Period, b: Period): boolean {
  return a.arrivalDate < b.departureDate && b.arrivalDate < a.departureDate;
}

/**
 * A reservation is "active" (blocks the room for its period) unless it is
 * CANCELLED or CHECKED_OUT (ST-001 review decision 5).
 */
export const CONFLICTING_RESERVATION_STATUSES: ReservationStatus[] = [
  ReservationStatus.NEW,
  ReservationStatus.CONFIRMED,
  ReservationStatus.CHECKED_IN,
];

export function isBlockingStatus(status: string): boolean {
  return (CONFLICTING_RESERVATION_STATUSES as string[]).includes(status);
}

/**
 * The single offer/sell rule (ST-001 §E, post-reconciliation):
 *   offerableForPeriod(room, [arrival, departure)) =
 *       room.status != MAINTENANCE
 *   AND no active reservation overlapping [arrival, departure)   <- `conflictsInPeriod`
 *   AND ( arrival > today OR room.status == AVAILABLE )
 *
 * `conflictsInPeriod` is the caller's pre-computed conflict answer (it needs
 * the database); everything else lives here so both the read path and the
 * write path share the exact same rule.
 */
export function isOfferableForPeriod(
  room: Pick<RoomEntity, 'status'>,
  arrivalDate: string,
  departureDate: string,
  today: string,
  conflictsInPeriod: boolean
): boolean {
  if (room.status === RoomStatus.MAINTENANCE) {
    return false;
  }
  if (arrivalDate <= today && room.status !== RoomStatus.AVAILABLE) {
    return false;
  }
  if (conflictsInPeriod) {
    return false;
  }
  return true;
}

/**
 * The confirm gate (ST-001 Final Review decision 1): period-only.
 * CONFIRMED = no conflicting reservation in the period AND the room is not
 * under maintenance. Physical AVAILABLE is NOT required (a currently OCCUPIED
 * room may still accept a CONFIRMED reservation for a later period).
 */
export function isConfirmable(
  room: Pick<RoomEntity, 'status'>,
  conflictsInPeriod: boolean
): boolean {
  return room.status !== RoomStatus.MAINTENANCE && !conflictsInPeriod;
}

export function hasActiveConflict(
  reservations: Array<Pick<ReservationEntity, 'id' | 'status' | 'arrivalDate' | 'departureDate' | 'roomId'>>,
  roomId: string,
  arrivalDate: string,
  departureDate: string,
  excludeReservationId?: string
): boolean {
  return reservations.some(
    (reservation) =>
      reservation.roomId === roomId &&
      reservation.id !== excludeReservationId &&
      isBlockingStatus(reservation.status) &&
      periodsOverlap({ arrivalDate, departureDate }, reservation)
  );
}