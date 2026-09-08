import { RoomStatus } from './enums';
import { RoomType } from '@/domain/reservation/enums';

export interface RoomEntity {
  id: string;
  roomNumber: string;
  roomType: RoomType | string;
  status: RoomStatus | string;
  createdAt: Date | string;
  updatedAt: Date | string;
}