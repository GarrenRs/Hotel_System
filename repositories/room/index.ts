import { PrismaRoomRepository } from './prisma.repository';
import { IRoomRepository } from './interface';

export const roomRepository: IRoomRepository = new PrismaRoomRepository();
export type { IRoomRepository };