import { IRoomRepository, roomRepository } from '@/repositories/room';
import { IReservationRepository, reservationRepository } from '@/repositories/reservation';
import { CreateRoomInput, RoomFilterInput, RoomStats } from '@/domain/room/types';
import { RoomEntity } from '@/domain/room/entities';
import { RoomStatus } from '@/domain/room/enums';
import { prisma } from '@/lib/prisma';
import { ROOM_TRANSITIONS } from '@/lib/status';
import { isOfferableForPeriod, isoToday, periodsOverlap } from '@/services/availability';
import { logger } from '@/lib/logger';

export class RoomNotFoundError extends Error {
  constructor(message = 'Room not found.') {
    super(message);
    this.name = 'RoomNotFoundError';
  }
}

export class InvalidRoomStatusError extends Error {
  constructor(message = 'The status value is not valid.') {
    super(message);
    this.name = 'InvalidRoomStatusError';
  }
}

export class RoomStatusLockedError extends Error {
  constructor(message = 'This status change is not allowed for the current room state.') {
    super(message);
    this.name = 'RoomStatusLockedError';
  }
}

export interface MaintenanceWarning {
  reservationId: string;
  customerName: string;
  arrivalDate: string;
  departureDate: string;
}

export class RoomService {
  constructor(
    private readonly repo: IRoomRepository = roomRepository,
    private readonly reservations: IReservationRepository = reservationRepository
  ) {}

  async createRoom(input: CreateRoomInput): Promise<RoomEntity> {
    return await this.repo.create(input);
  }

  async getAllRooms(filter?: RoomFilterInput): Promise<RoomEntity[]> {
    return await this.repo.findAll(filter);
  }

  async getRoomById(id: string): Promise<RoomEntity | null> {
    return await this.repo.findById(id);
  }

  async deleteRoom(id: string): Promise<boolean> {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new RoomNotFoundError();
    }
    return await this.repo.delete(id);
  }

  async getRoomStats(): Promise<RoomStats> {
    return await this.repo.getStats();
  }

  /**
   * The public availability query (GET /api/rooms/available and the guest
   * form). Returns exactly the rooms the shared offer rule (isOfferableForPeriod)
   * says can be sold for [arrival, departure). The write path re-validates.
   */
  async getAvailableRoomsForPeriod(input: { arrivalDate: string; departureDate: string; roomType?: string }): Promise<RoomEntity[]> {
    const rooms = await this.repo.findAll({ roomType: input.roomType || undefined });
    const candidates = rooms.filter((room) => room.status !== RoomStatus.MAINTENANCE);
    const blocking = await this.reservations.findBlockingReservations(candidates.map((room) => room.id));

    const period = { arrivalDate: input.arrivalDate, departureDate: input.departureDate };
    const today = isoToday();

    return candidates.filter((room) => {
      const conflicts = blocking.some(
        (blockingReservation) =>
          blockingReservation.roomId === room.id &&
          periodsOverlap(period, {
            arrivalDate: blockingReservation.arrivalDate,
            departureDate: blockingReservation.departureDate,
          })
      );

      return isOfferableForPeriod(room, period.arrivalDate, period.departureDate, today, conflicts);
    });
  }

  /**
   * Manual operational room toggle (ST-001 §G/H) — the only room mutations
   * besides the booking flow. OCCUPIED is never touched here; check-in/check-out
   * are reservation-side effects. Legal edges come from ROOM_TRANSITIONS.
   * Taking a room to MAINTENANCE returns the affected CONFIRMED reservations
   * as warnings (never auto-cancelled).
   */
  async updateRoomOperationalStatus(
    id: string,
    toStatus: string
  ): Promise<{ room: RoomEntity; warnings: MaintenanceWarning[] }> {
    const target = toStatus as RoomStatus;

    if (!Object.values(RoomStatus).includes(target)) {
      throw new InvalidRoomStatusError();
    }

    return await prisma.$transaction(async (tx) => {
      await this.repo.lockRoomById(id, tx);

      const room = await this.repo.findById(id, tx);
      if (!room) {
        throw new RoomNotFoundError();
      }

      const fromStatus = room.status as RoomStatus;
      const allowed = ROOM_TRANSITIONS[fromStatus] ?? [];
      if (!allowed.includes(target)) {
        logger.info('Rejected room status change', { roomId: id, from: fromStatus, to: target });
        throw new RoomStatusLockedError('This room cannot change to the requested status from its current state.');
      }

      let warnings: MaintenanceWarning[] = [];
      if (target === RoomStatus.MAINTENANCE) {
        warnings = await this.reservations.findUpcomingConfirmedForRoom(id, isoToday());
      }

      const updated = await this.repo.updateStatus(id, target, tx);
      return { room: updated, warnings };
    });
  }
}

export const roomService = new RoomService();