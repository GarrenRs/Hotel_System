import { ReservationStatus, RoomType } from './enums';

export interface ReservationEntity {
  id: string;
  reservationId: string;
  customerName: string;
  phone: string;
  email: string;
  arrivalDate: string;
  departureDate: string;
  guests: number;
  roomType: RoomType | string;
  status: ReservationStatus | string;
  notes?: string | null;
  roomId?: string | null;
  roomNumber?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}