import { IReservationRepository, reservationRepository } from '@/repositories/reservation';
import { CreateReservationInput, ReservationFilterInput, ReservationStats } from '@/domain/reservation/types';
import { ReservationEntity } from '@/domain/reservation/entities';
import { ReservationStatus } from '@/domain/reservation/enums';
import { Prisma } from '@prisma/client';
import { logger } from '@/lib/logger';

export class ReservationConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ReservationConflictError';
  }
}

const MAX_RESERVATION_ID_ATTEMPTS = 5;

export class ReservationService {
  constructor(private readonly repo: IReservationRepository = reservationRepository) {}

  private generateReservationId(): string {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `NP-2026-${randomSuffix}`;
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

  async createReservation(input: CreateReservationInput): Promise<ReservationEntity> {
    if (input.roomId) {
      const hasConflict = await this.repo.hasConflictingReservation({
        roomId: input.roomId,
        arrivalDate: input.arrivalDate,
        departureDate: input.departureDate,
      });

      if (hasConflict) {
        throw new ReservationConflictError('This room is already reserved for the selected dates.');
      }
    }

    for (let attempt = 0; attempt < MAX_RESERVATION_ID_ATTEMPTS; attempt++) {
      const reservationId = await this.allocateReservationId();

      try {
        return await this.repo.create({
          ...input,
          reservationId,
        });
      } catch (error) {
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

  async updateReservationStatus(id: string, status: ReservationStatus | string): Promise<ReservationEntity> {
    const validStatuses = Object.values(ReservationStatus);
    if (!validStatuses.includes(status as ReservationStatus)) {
      throw new Error(`Invalid status: ${status}`);
    }

    if (status === ReservationStatus.CONFIRMED) {
      const existing = await this.repo.findById(id);
      if (existing?.roomId) {
        const hasConflict = await this.repo.hasConflictingReservation({
          roomId: existing.roomId,
          arrivalDate: existing.arrivalDate,
          departureDate: existing.departureDate,
          excludeReservationId: existing.id,
        });

        if (hasConflict) {
          throw new ReservationConflictError('Cannot confirm: the assigned room is already reserved for overlapping dates.');
        }
      }
    }

    return await this.repo.updateStatus(id, status);
  }

  async deleteReservation(id: string): Promise<boolean> {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new Error('Reservation not found');
    }
    return await this.repo.delete(id);
  }

  async getReservationStats(): Promise<ReservationStats> {
    return await this.repo.getStats();
  }
}

export const reservationService = new ReservationService();