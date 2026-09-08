import { ReservationEntity } from '@/domain/reservation/entities';
import { CreateReservationInput, ReservationFilterInput, ReservationStats } from '@/domain/reservation/types';

export interface IReservationRepository {
  create(data: CreateReservationInput & { reservationId: string }): Promise<ReservationEntity>;
  findAll(filter?: ReservationFilterInput): Promise<ReservationEntity[]>;
  findById(id: string): Promise<ReservationEntity | null>;
  updateStatus(id: string, status: string): Promise<ReservationEntity>;
  delete(id: string): Promise<boolean>;
  getStats(): Promise<ReservationStats>;
  hasConflictingReservation(input: {
    roomId: string;
    arrivalDate: string;
    departureDate: string;
    excludeReservationId?: string;
  }): Promise<boolean>;
  reservationIdExists(reservationId: string): Promise<boolean>;
}