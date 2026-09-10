import { ReservationEntity } from '@/domain/reservation/entities';
import { CreateReservationInput, ReservationFilterInput } from '@/domain/reservation/types';
import type { Prisma } from '@prisma/client';
import { AdminReservationStats } from './prisma.repository';

type Tx = Prisma.TransactionClient;

export interface IReservationRepository {
  create(data: CreateReservationInput & { reservationId: string }, tx?: Tx): Promise<ReservationEntity>;
  findAll(filter?: ReservationFilterInput): Promise<ReservationEntity[]>;
  findById(id: string, tx?: Tx): Promise<ReservationEntity | null>;
  updateStatus(id: string, status: string, tx?: Tx): Promise<ReservationEntity>;
  delete(id: string): Promise<boolean>;
  getAdminReservationStats(today: string): Promise<AdminReservationStats>;
  hasConflictingReservation(input: {
    roomId: string;
    arrivalDate: string;
    departureDate: string;
    excludeReservationId?: string;
  }, tx?: Tx): Promise<boolean>;
  findBlockingReservations(roomIds: string[]): Promise<
    Array<{ roomId: string | null; arrivalDate: string; departureDate: string }>
  >;
  findUpcomingConfirmedForRoom(
    roomId: string,
    today: string
  ): Promise<Array<{ reservationId: string; customerName: string; arrivalDate: string; departureDate: string }>>;
  reservationIdExists(reservationId: string): Promise<boolean>;
}

export type { AdminReservationStats };