import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { IReservationRepository, reservationRepository } from '@/repositories/reservation';
import { IRoomRepository, roomRepository } from '@/repositories/room';
import { CreateReservationInput, ReservationFilterInput } from '@/domain/reservation/types';
import { ReservationEntity } from '@/domain/reservation/entities';
import { ReservationStatus } from '@/domain/reservation/enums';
import { RoomStatus } from '@/domain/room/enums';
import { RESERVATION_TRANSITIONS } from '@/lib/status';
import { isOfferableForPeriod, isConfirmable, isoToday } from '@/services/availability';
import { ROOM_TYPES_LIST } from '@/lib/constants';
import { logger } from '@/lib/logger';

const MAX_RESERVATION_ID_ATTEMPTS = 5;

export class ReservationConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ReservationConflictError';
  }
}

export class ReservationNotFoundError extends Error {
  constructor(message = 'Reservation not found.') {
    super(message);
    this.name = 'ReservationNotFoundError';
  }
}

export class InvalidTransitionError extends Error {
  constructor(from: string, to: string) {
    super(`Invalid transition from ${from} to ${to}.`);
    this.name = 'InvalidTransitionError';
  }
}

export class CheckInBeforeArrivalError extends Error {
  constructor(message = 'Guest cannot check in before the arrival date.') {
    super(message);
    this.name = 'CheckInBeforeArrivalError';
  }
}

export class RoomNotReadyForCheckInError extends Error {
  constructor(message = 'Room is not ready for check-in.') {
    super(message);
    this.name = 'RoomNotReadyForCheckInError';
  }
}

export class RoomNotFoundError extends Error {
  constructor(message = 'The assigned room does not exist.') {
    super(message);
    this.name = 'RoomNotFoundError';
  }
}

export class RoomTypeMismatchError extends Error {
  constructor(message = 'The selected room does not match the requested room type.') {
    super(message);
    this.name = 'RoomTypeMismatchError';
  }
}

export class CapacityExceededError extends Error {
  constructor(message = 'The number of guests exceeds the capacity of this room type.') {
    super(message);
    this.name = 'CapacityExceededError';
  }
}

export class ReservationService {
  constructor(
    private readonly repo: IReservationRepository = reservationRepository,
    private readonly rooms: IRoomRepository = roomRepository
  ) {}

  private generateReservationId(): string {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `HB-2026-${randomSuffix}`;
  }

  private static isContentionError(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === 'P2028' || error.code === 'P2034')
    );
  }

  private async allocateReservationId(): Promise<string> {
    for (let attempt = 0; attempt < MAX_RESERVATION_ID_ATTEMPTS; attempt++) {
      const reservationId = this.generateReservationId();
      const exists = await this.repo.reservationIdExists(reservationId);
      if (!exists) {
        return reservationId;
      }
      logger.info('Reservation ID collision detected, regenerating', { reservationId, attempt: attempt + 1 });
    }

    throw new Error('Could not allocate a unique reservation reference. Please try again.');
  }

  /**
   * Guest booking. Runs inside a transaction with a `SELECT ... FOR UPDATE`
   * lock on the room so concurrent guests cannot double-book the same room
   * (ST-001 Final Review decision 4). The offer rule, capacity rule, and
   * conflict rule are all re-validated server-side here; the UI offer is
   * advisory only.
   */
  async createReservation(input: CreateReservationInput): Promise<ReservationEntity> {
    for (let attempt = 0; attempt < MAX_RESERVATION_ID_ATTEMPTS; attempt++) {
      const reservationId = await this.allocateReservationId();

      try {
        return await prisma.$transaction(async (tx) => {
          const room = await this.rooms.findById(input.roomId ?? '', tx);
          if (!room || room.id !== input.roomId) {
            throw new RoomNotFoundError();
          }

          if (room.roomType !== input.roomType) {
            throw new RoomTypeMismatchError();
          }

          const typeConfig = ROOM_TYPES_LIST.find((type) => type.id === input.roomType);
          if (!typeConfig) {
            throw new RoomTypeMismatchError();
          }

          if (Number(input.guests) > typeConfig.capacity) {
            throw new CapacityExceededError();
          }

          await this.rooms.lockRoomById(room.id, tx);

          const hasConflict = await this.repo.hasConflictingReservation(
            {
              roomId: room.id,
              arrivalDate: input.arrivalDate,
              departureDate: input.departureDate,
            },
            tx
          );

          if (!isOfferableForPeriod(room, input.arrivalDate, input.departureDate, isoToday(), hasConflict)) {
            throw new ReservationConflictError('Room is not available for the selected dates.');
          }

          return await this.repo.create({ ...input, reservationId }, tx);
        });
      } catch (error) {
        if (ReservationService.isContentionError(error)) {
          logger.warn('Transaction contention while booking, rejecting as unavailable', {
            reservationId,
            attempt: attempt + 1,
          });
          throw new ReservationConflictError('Room is not available for the selected dates.');
        }
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          logger.info('Reservation ID collision on insert, retrying', {
            reservationId,
            attempt: attempt + 1,
          });
          continue;
        }
        throw error;
      }
    }

    logger.error('Exhausted reservation ID generation attempts');
    throw new Error('Could not allocate a unique reservation reference. Please try again.');
  }

  async getAllReservations(filter?: ReservationFilterInput): Promise<ReservationEntity[]> {
    return await this.repo.findAll(filter);
  }

  async getReservationById(id: string): Promise<ReservationEntity | null> {
    return await this.repo.findById(id);
  }

  /**
   * Single authoritative state transition (ST-001 §C through §F). Verifies the
   * transition is legal per RESERVATION_TRANSITIONS, then applies the gate and
   * the room side effects. All write paths go through this method; delete is
   * the only other mutating operation.
   */
  async transitionReservation(id: string, toStatus: string): Promise<ReservationEntity> {
    const target = toStatus as ReservationStatus;

    try {
      return await prisma.$transaction(async (tx) => {
      const reservation = await this.repo.findById(id, tx);
      if (!reservation) {
        throw new ReservationNotFoundError();
      }

      const fromStatus = reservation.status as ReservationStatus;
      const allowed = RESERVATION_TRANSITIONS[fromStatus] ?? [];
      if (!allowed.includes(target)) {
        throw new InvalidTransitionError(fromStatus, toStatus);
      }

      const today = isoToday();

      if (target === ReservationStatus.CONFIRMED) {
        const room = await this.requireLockedRoom(reservation, tx);
        const hasConflict = await this.repo.hasConflictingReservation(
          {
            roomId: room.id,
            arrivalDate: reservation.arrivalDate,
            departureDate: reservation.departureDate,
            excludeReservationId: reservation.id,
          },
          tx
        );

        if (!isConfirmable(room, hasConflict)) {
          throw new ReservationConflictError('Cannot confirm: the room is under maintenance or already reserved for overlapping dates.');
        }
      }

      if (target === ReservationStatus.CHECKED_IN) {
        if (reservation.arrivalDate > today) {
          throw new CheckInBeforeArrivalError();
        }

        const room = await this.requireLockedRoom(reservation, tx);
        if (room.status !== RoomStatus.AVAILABLE) {
          throw new RoomNotReadyForCheckInError('Room is not available for check-in.');
        }

        const hasConflict = await this.repo.hasConflictingReservation(
          {
            roomId: room.id,
            arrivalDate: reservation.arrivalDate,
            departureDate: reservation.departureDate,
            excludeReservationId: reservation.id,
          },
          tx
        );
        if (hasConflict) {
          throw new ReservationConflictError('Cannot check in: the room has a conflicting reservation for this period.');
        }

        await this.rooms.updateStatus(room.id, RoomStatus.OCCUPIED, tx);
      }

      if (target === ReservationStatus.CHECKED_OUT) {
        const room = await this.requireLockedRoom(reservation, tx);
        await this.rooms.updateStatus(room.id, RoomStatus.CLEANING, tx);
      }

      return await this.repo.updateStatus(id, target, tx);
      });
    } catch (error) {
      if (ReservationService.isContentionError(error)) {
        logger.warn('Transaction contention during reservation transition', { id, toStatus });
        throw new ReservationConflictError('Cannot update: the room is momentarily busy. Please try again.');
      }
      throw error;
    }
  }

  async deleteReservation(id: string): Promise<boolean> {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new ReservationNotFoundError();
    }
    return await this.repo.delete(id);
  }

  private async requireLockedRoom(
    reservation: ReservationEntity,
    tx: Prisma.TransactionClient
  ): Promise<import('@/domain/room/entities').RoomEntity> {
    if (!reservation.roomId) {
      throw new RoomNotFoundError();
    }
    const room = await this.rooms.findById(reservation.roomId, tx);
    if (!room) {
      throw new RoomNotFoundError();
    }
    await this.rooms.lockRoomById(room.id, tx);
    return room;
  }
}

export const reservationService = new ReservationService();