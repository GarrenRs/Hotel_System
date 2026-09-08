import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { IReservationRepository } from './interface';
import { ReservationEntity } from '@/domain/reservation/entities';
import { CreateReservationInput, ReservationFilterInput, ReservationStats } from '@/domain/reservation/types';
import { ReservationStatus } from '@/domain/reservation/enums';

export class PrismaReservationRepository implements IReservationRepository {
  async create(data: CreateReservationInput & { reservationId: string }): Promise<ReservationEntity> {
    const createPayload: Prisma.ReservationUncheckedCreateInput = {
      reservationId: data.reservationId,
      customerName: data.customerName,
      phone: data.phone,
      email: data.email,
      arrivalDate: data.arrivalDate,
      departureDate: data.departureDate,
      guests: Number(data.guests),
      roomType: data.roomType,
      notes: data.notes || '',
      status: ReservationStatus.NEW,
      roomId: data.roomId,
    };

    const reservation = await prisma.reservation.create({
      data: createPayload,
    });

    return reservation;
  }

  async findAll(filter?: ReservationFilterInput): Promise<ReservationEntity[]> {
    const where: Prisma.ReservationWhereInput = {};

    if (filter?.status && filter.status !== 'ALL') {
      where.status = filter.status;
    }

    if (filter?.roomType && filter.roomType !== 'ALL') {
      where.roomType = filter.roomType;
    }

    if (filter?.searchQuery && filter.searchQuery.trim() !== '') {
      const query = filter.searchQuery.trim();
      where.OR = [
        { customerName: { contains: query } },
        { phone: { contains: query } },
        { reservationId: { contains: query } },
        { email: { contains: query } },
      ];
    }

    const reservations = await prisma.reservation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return reservations;
  }

  async findById(id: string): Promise<ReservationEntity | null> {
    const reservation = await prisma.reservation.findFirst({
      where: {
        OR: [
          { id },
          { reservationId: id },
        ],
      },
    });

    return reservation;
  }

  async updateStatus(id: string, status: string): Promise<ReservationEntity> {
    await this.assertExists(id);

    const updated = await prisma.reservation.update({
      where: { id },
      data: { status },
    });

    return updated;
  }

  async delete(id: string): Promise<boolean> {
    await this.assertExists(id);

    await prisma.reservation.delete({
      where: { id },
    });

    return true;
  }

  async getStats(): Promise<ReservationStats> {
    const total = await prisma.reservation.count();
    const newCount = await prisma.reservation.count({ where: { status: ReservationStatus.NEW } });
    const pendingCount = await prisma.reservation.count({ where: { status: ReservationStatus.PENDING } });
    const confirmedCount = await prisma.reservation.count({ where: { status: ReservationStatus.CONFIRMED } });
    const cancelledCount = await prisma.reservation.count({ where: { status: ReservationStatus.CANCELLED } });

    return {
      total,
      newCount,
      pendingCount,
      confirmedCount,
      cancelledCount,
    };
  }

  async hasConflictingReservation(input: {
    roomId: string;
    arrivalDate: string;
    departureDate: string;
    excludeReservationId?: string;
  }): Promise<boolean> {
    const where: Prisma.ReservationWhereInput = {
      roomId: input.roomId,
      arrivalDate: { lt: input.departureDate },
      departureDate: { gt: input.arrivalDate },
      status: { not: ReservationStatus.CANCELLED },
      ...(input.excludeReservationId ? { id: { not: input.excludeReservationId } } : {}),
    };

    const conflicting = await prisma.reservation.findFirst({ where });

    return conflicting !== null;
  }

  async reservationIdExists(reservationId: string): Promise<boolean> {
    const existing = await prisma.reservation.findUnique({
      where: { reservationId },
      select: { id: true },
    });

    return existing !== null;
  }

  private async assertExists(id: string): Promise<void> {
    const existing = await prisma.reservation.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      throw new Error('Reservation not found');
    }
  }
}