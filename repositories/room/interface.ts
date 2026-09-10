import { RoomEntity } from '@/domain/room/entities';
import { CreateRoomInput, RoomFilterInput, RoomStats } from '@/domain/room/types';
import type { Prisma } from '@prisma/client';

type Tx = Prisma.TransactionClient;

export interface IRoomRepository {
  create(data: CreateRoomInput): Promise<RoomEntity>;
  findAll(filter?: RoomFilterInput): Promise<RoomEntity[]>;
  findById(id: string, tx?: Tx): Promise<RoomEntity | null>;
  lockRoomById(id: string, tx: Tx): Promise<void>;
  updateStatus(id: string, status: string, tx?: Tx): Promise<RoomEntity>;
  delete(id: string): Promise<boolean>;
  getStats(): Promise<RoomStats>;
}