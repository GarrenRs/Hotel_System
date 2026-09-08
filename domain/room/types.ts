import { RoomType } from '@/domain/reservation/enums';
import { RoomStatus } from './enums';
import { ApiResponse } from '@/domain/reservation/types';

export interface CreateRoomInput {
  roomNumber: string;
  roomType: RoomType | string;
  status?: RoomStatus | string;
}

export interface UpdateRoomStatusInput {
  id: string;
  status: RoomStatus | string;
}

export interface RoomFilterInput {
  status?: RoomStatus | string;
  roomType?: RoomType | string;
  searchQuery?: string;
}

export interface RoomStats {
  total: number;
  availableCount: number;
  occupiedCount: number;
  cleaningCount: number;
  maintenanceCount: number;
}

export type { ApiResponse };