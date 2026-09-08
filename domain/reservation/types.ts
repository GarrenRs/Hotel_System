import { ReservationStatus, RoomType } from './enums';

export interface CreateReservationInput {
  customerName: string;
  phone: string;
  email: string;
  arrivalDate: string;
  departureDate: string;
  guests: number;
  roomType: RoomType | string;
  roomId?: string;
  notes?: string;
}

export interface UpdateReservationStatusInput {
  id: string;
  status: ReservationStatus | string;
}

export interface ReservationFilterInput {
  status?: ReservationStatus | string;
  roomType?: RoomType | string;
  searchQuery?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
  errors?: string[];
}

export interface ReservationStats {
  total: number;
  newCount: number;
  pendingCount: number;
  confirmedCount: number;
  cancelledCount: number;
}
