import { RoomStatus } from './enums';
import { RoomType } from '@/domain/reservation/enums';

export interface RoomEntity {
  id: string;
  roomNumber: string;
  roomType: RoomType | string;
  status: RoomStatus | string;
  /**
   * Display-only derived field: the name of the in-house guest when the room
   * is OCCUPIED (sourced from the CHECKED_IN reservation for that room).
   * Never stored; never written. Null on non-OCCUPIED rooms.
   */
  currentGuestName?: string | null;
  /**
   * Display-only derived field: departure date of the current guest when the
   * room is OCCUPIED. Never stored; never written.
   */
  currentGuestDeparture?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}