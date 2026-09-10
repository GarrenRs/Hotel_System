import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { IRoomRepository } from './interface';
import { RoomEntity } from '@/domain/room/entities';
import { CreateRoomInput, RoomFilterInput, RoomStats } from '@/domain/room/types';
import { RoomStatus } from '@/domain/room/enums';
import { ReservationStatus } from '@/domain/reservation/enums';

type Tx = Prisma.TransactionClient;

function toEntity(
  room: Awaited<ReturnType<typeof prisma.room.findUnique>> & {
    reservations?: Array<{ customerName: string; departureDate: string }> | undefined;
  }
): RoomEntity {
  const { reservations, ...rest } = room;
  const currentGuest = reservations && reservations.length > 0 ? reservations[0] : null;
  return {
    ...rest,
    currentGuestName: currentGuest?.customerName ?? null,
    currentGuestDeparture: currentGuest?.departureDate ?? null,
  };
}

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
      include: {
        reservations: {
          where: { status: ReservationStatus.CHECKED_IN },
          select: { customerName: true, departureDate: true },
          take: 1,
        },
      },
    });

    return rooms.map(toEntity);
  }

  async findById(id: string, tx?: Tx): Promise<RoomEntity | null> {
    const client = tx ?? prisma;
    const room = await client.room.findUnique({
      where: { id },
    });

    return room;
  }

  async lockRoomById(id: string, tx: Tx): Promise<void> {
    await tx.$queryRaw`SELECT "id" FROM "Room" WHERE "id" = ${id} FOR UPDATE`;
  }

  async updateStatus(id: string, status: string, tx?: Tx): Promise<RoomEntity> {
    await this.assertExists(id, tx);

    const client = tx ?? prisma;
    const updated = await client.room.update({
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

  private async assertExists(id: string, tx?: Tx): Promise<void> {
    const client = tx ?? prisma;
    const existing = await client.room.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      throw new Error('Room not found');
    }
  }
}