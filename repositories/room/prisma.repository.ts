import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { IRoomRepository } from './interface';
import { RoomEntity } from '@/domain/room/entities';
import { CreateRoomInput, RoomFilterInput, RoomStats } from '@/domain/room/types';
import { RoomStatus } from '@/domain/room/enums';

export class PrismaRoomRepository implements IRoomRepository {
  async create(data: CreateRoomInput): Promise<RoomEntity> {
    const room = await prisma.room.create({
      data: {
        roomNumber: data.roomNumber,
        roomType: data.roomType,
        status: data.status || RoomStatus.AVAILABLE,
      },
    });

    return room;
  }

  async findAll(filter?: RoomFilterInput): Promise<RoomEntity[]> {
    const where: Prisma.RoomWhereInput = {};

    if (filter?.status && filter.status !== 'ALL') {
      where.status = filter.status;
    }

    if (filter?.roomType && filter.roomType !== 'ALL') {
      where.roomType = filter.roomType;
    }

    if (filter?.searchQuery && filter.searchQuery.trim() !== '') {
      const query = filter.searchQuery.trim();
      where.OR = [
        { roomNumber: { contains: query } },
        { roomType: { contains: query } },
      ];
    }

    const rooms = await prisma.room.findMany({
      where,
      orderBy: { roomNumber: 'asc' },
    });

    return rooms;
  }

  async findById(id: string): Promise<RoomEntity | null> {
    const room = await prisma.room.findUnique({
      where: { id },
    });

    return room;
  }

  async updateStatus(id: string, status: string): Promise<RoomEntity> {
    await this.assertExists(id);

    const updated = await prisma.room.update({
      where: { id },
      data: { status },
    });

    return updated;
  }

  async delete(id: string): Promise<boolean> {
    await this.assertExists(id);

    await prisma.room.delete({
      where: { id },
    });

    return true;
  }

  async getStats(): Promise<RoomStats> {
    const total = await prisma.room.count();
    const availableCount = await prisma.room.count({ where: { status: RoomStatus.AVAILABLE } });
    const occupiedCount = await prisma.room.count({ where: { status: RoomStatus.OCCUPIED } });
    const cleaningCount = await prisma.room.count({ where: { status: RoomStatus.CLEANING } });
    const maintenanceCount = await prisma.room.count({ where: { status: RoomStatus.MAINTENANCE } });

    return {
      total,
      availableCount,
      occupiedCount,
      cleaningCount,
      maintenanceCount,
    };
  }

  private async assertExists(id: string): Promise<void> {
    const existing = await prisma.room.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      throw new Error('Room not found');
    }
  }
}