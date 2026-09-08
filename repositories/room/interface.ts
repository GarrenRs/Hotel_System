import { RoomEntity } from '@/domain/room/entities';
import { CreateRoomInput, RoomFilterInput, RoomStats } from '@/domain/room/types';

export interface IRoomRepository {
  create(data: CreateRoomInput): Promise<RoomEntity>;
  findAll(filter?: RoomFilterInput): Promise<RoomEntity[]>;
  findById(id: string): Promise<RoomEntity | null>;
  updateStatus(id: string, status: string): Promise<RoomEntity>;
  delete(id: string): Promise<boolean>;
  getStats(): Promise<RoomStats>;
}