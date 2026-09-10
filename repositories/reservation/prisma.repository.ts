import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { IReservationRepository } from './interface';
import { ReservationEntity } from '@/domain/reservation/entities';
import { CreateReservationInput, ReservationFilterInput, CurrentGuestInfo } from '@/domain/reservation/types';
import { ReservationStatus } from '@/domain/reservation/enums';

type Tx = Prisma.TransactionClient;

const reservationWithRoom = {
  include: {
    room: { select: { roomNumber: true } },
  },
} as const;

function toEntity(
  reservation: Awaited<ReturnType<typeof prisma.reservation.findUnique>> & { room?: { roomNumber: string } | null }
): ReservationEntity {
  const { room, ...rest } = reservation;
  return { ...rest, roomNumber: room?.roomNumber ?? null };
}

export interface AdminReservationStats {
  total: number;
  newCount: number;
  confirmedCount: number;
  checkedInCount: number;
  checkedOutCount: number;
  cancelledCount: number;
  todayArrivals: number;
  todayDepartures: number;
  reservedUpcoming: number;
  currentGuests: CurrentGuestInfo[];
}

export class PrismaReservationRepository implements IReservationRepository {
  async create(data: CreateReservationInput & { reservationId: string }, tx?: Tx): Promise<ReservationEntity> {
    const client = tx ?? prisma;
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

    const reservation = await client.reservation.create({
      data: createPayload,
      ...reservationWithRoom,
    });

    return toEntity(reservation);
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
      ...reservationWithRoom,
    });

    return reservations.map(toEntity);
  }

  async findById(id: string, tx?: Tx): Promise<ReservationEntity | null> {
    const client = tx ?? prisma;
    const reservation = await client.reservation.findFirst({
      where: {
        OR: [
          { id },
          { reservationId: id },
        ],
      },
      ...reservationWithRoom,
    });

    return reservation ? toEntity(reservation) : null;
  }

  async updateStatus(id: string, status: string, tx?: Tx): Promise<ReservationEntity> {
    await this.assertExists(id, tx);

    const client = tx ?? prisma;
    const updated = await client.reservation.update({
      where: { id },
      data: { status },
      ...reservationWithRoom,
    });

    return toEntity(updated);
  }

  async delete(id: string): Promise<boolean> {
    await this.assertExists(id);

    await prisma.reservation.delete({
      where: { id },
    });

    return true;
  }

  async getAdminReservationStats(today: string): Promise<AdminReservationStats> {
    const [
      total,
      newCount,
      confirmedCount,
      checkedInCount,
      checkedOutCount,
      cancelledCount,
      todayArrivals,
      todayDepartures,
      upcomingReservations,
      checkedInReservations,
    ] = await Promise.all([
      prisma.reservation.count(),
      prisma.reservation.count({ where: { status: ReservationStatus.NEW } }),
      prisma.reservation.count({ where: { status: ReservationStatus.CONFIRMED } }),
      prisma.reservation.count({ where: { status: ReservationStatus.CHECKED_IN } }),
      prisma.reservation.count({ where: { status: ReservationStatus.CHECKED_OUT } }),
      prisma.reservation.count({ where: { status: ReservationStatus.CANCELLED } }),
      prisma.reservation.count({ where: { status: ReservationStatus.CONFIRMED, arrivalDate: today } }),
      prisma.reservation.count({ where: { status: ReservationStatus.CHECKED_IN, departureDate: today } }),
      prisma.reservation.findMany({
        where: { status: ReservationStatus.CONFIRMED, arrivalDate: { gte: today } },
        select: { roomId: true },
      }),
      prisma.reservation.findMany({
        where: { status: ReservationStatus.CHECKED_IN },
        include: { room: { select: { roomNumber: true } } },
      }),
    ]);

    const reservedUpcoming = new Set(upcomingReservations.map((r) => r.roomId).filter((id): id is string => Boolean(id))).size;

    const currentGuests: CurrentGuestInfo[] = checkedInReservations.map((reservation) => ({
      reservationId: reservation.reservationId,
      guestName: reservation.customerName,
      roomNumber: reservation.room?.roomNumber ?? '—',
      roomType: reservation.roomType,
      arrivalDate: reservation.arrivalDate,
      departureDate: reservation.departureDate,
    }));

    return {
      total,
      newCount,
      confirmedCount,
      checkedInCount,
      checkedOutCount,
      cancelledCount,
      todayArrivals,
      todayDepartures,
      reservedUpcoming,
      currentGuests,
    };
  }

  async hasConflictingReservation(
    input: {
      roomId: string;
      arrivalDate: string;
      departureDate: string;
      excludeReservationId?: string;
    },
    tx?: Tx
  ): Promise<boolean> {
    const client = tx ?? prisma;
    const where: Prisma.ReservationWhereInput = {
      roomId: input.roomId,
      arrivalDate: { lt: input.departureDate },
      departureDate: { gt: input.arrivalDate },
      status: { notIn: [ReservationStatus.CANCELLED, ReservationStatus.CHECKED_OUT] },
      ...(input.excludeReservationId ? { id: { not: input.excludeReservationId } } : {}),
    };

    const conflicting = await client.reservation.findFirst({ where });

    return conflicting !== null;
  }

  /**
   * All period-blocking reservations for a set of rooms (status NOT IN
   * [CANCELLED, CHECKED_OUT]). Used by the availability read path so the whole
   * period check runs in the service layer in a single query.
   */
  async findBlockingReservations(roomIds: string[]): Promise<
    Array<{ roomId: string | null; arrivalDate: string; departureDate: string }>
  > {
    if (roomIds.length === 0) {
      return [];
    }

    const reservations = await prisma.reservation.findMany({
      where: {
        roomId: { in: roomIds },
        status: { notIn: [ReservationStatus.CANCELLED, ReservationStatus.CHECKED_OUT] },
      },
      select: {
        roomId: true,
        arrivalDate: true,
        departureDate: true,
      },
    });

    return reservations;
  }

  /**
   * CONFIRMED reservations that would be affected by taking a room out of
   * service (used to produce the maintenance warning list; never auto-cancels).
   */
  async findUpcomingConfirmedForRoom(
    roomId: string,
    today: string
  ): Promise<Array<{ reservationId: string; customerName: string; arrivalDate: string; departureDate: string }>> {
    return prisma.reservation.findMany({
      where: {
        roomId,
        status: ReservationStatus.CONFIRMED,
        arrivalDate: { gte: today },
      },
      select: {
        reservationId: true,
        customerName: true,
        arrivalDate: true,
        departureDate: true,
      },
    });
  }

  async reservationIdExists(reservationId: string): Promise<boolean> {
    const existing = await prisma.reservation.findUnique({
      where: { reservationId },
      select: { id: true },
    });

    return existing !== null;
  }

  private async assertExists(id: string, tx?: Tx): Promise<void> {
    const client = tx ?? prisma;
    const existing = await client.reservation.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      throw new Error('Reservation not found');
    }
  }
}