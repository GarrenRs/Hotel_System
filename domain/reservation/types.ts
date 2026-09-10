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

export interface CurrentGuestInfo {
  reservationId: string;
  guestName: string;
  roomNumber: string;
  roomType: RoomType | string;
  arrivalDate: string;
  departureDate: string;
}

export interface AdminStats {
  totalRooms: number;
  availableRooms: number;
  occupiedRooms: number;
  cleaningRooms: number;
  maintenanceRooms: number;
  reservedUpcoming: number;
  todayArrivals: number;
  todayDepartures: number;
  total: number;
  newCount: number;
  confirmedCount: number;
  checkedInCount: number;
  checkedOutCount: number;
  cancelledCount: number;
  currentGuests: CurrentGuestInfo[];
}