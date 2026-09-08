import { IRoomRepository, roomRepository } from '@/repositories/room';
import { CreateRoomInput, RoomFilterInput, RoomStats } from '@/domain/room/types';
import { RoomEntity } from '@/domain/room/entities';
import { RoomStatus } from '@/domain/room/enums';

export class RoomService {
  constructor(private readonly repo: IRoomRepository = roomRepository) {}

  async createRoom(input: CreateRoomInput): Promise<RoomEntity> {
    return await this.repo.create(input);
  }

  async getAllRooms(filter?: RoomFilterInput): Promise<RoomEntity[]> {
    return await this.repo.findAll(filter);
  }

  async getRoomById(id: string): Promise<RoomEntity | null> {
    return await this.repo.findById(id);
  }

  async updateRoomStatus(id: string, status: RoomStatus | string): Promise<RoomEntity> {
    const validStatuses = Object.values(RoomStatus);
    if (!validStatuses.includes(status as RoomStatus)) {
      throw new Error(`Invalid status: ${status}`);
    }

    return await this.repo.updateStatus(id, status);
  }

  async deleteRoom(id: string): Promise<boolean> {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new Error('Room not found');
    }
    return await this.repo.delete(id);
  }

  async getRoomStats(): Promise<RoomStats> {
    return await this.repo.getStats();
  }
}

export const roomService = new RoomService();