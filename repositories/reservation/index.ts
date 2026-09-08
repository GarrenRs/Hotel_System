import { PrismaReservationRepository } from './prisma.repository';
import { IReservationRepository } from './interface';

export const reservationRepository: IReservationRepository = new PrismaReservationRepository();
export type { IReservationRepository };
