import { roomRepository } from '@/repositories/room';
import { reservationRepository } from '@/repositories/reservation';
import { AdminStats } from '@/domain/reservation/types';
import { isoToday } from '@/services/availability';

/**
 * Composes the room stats and the reservation admin stats into the AdminStats
 * dashboard payload (ST-001 §K). The dashboard is the single consumer.
 */
export class AdminService {
  async getDashboardStats(): Promise<AdminStats> {
    const [roomStats, reservationStats] = await Promise.all([
      roomRepository.getStats(),
      reservationRepository.getAdminReservationStats(isoToday()),
    ]);

    return {
      totalRooms: roomStats.total,
      availableRooms: roomStats.availableCount,
      occupiedRooms: roomStats.occupiedCount,
      cleaningRooms: roomStats.cleaningCount,
      maintenanceRooms: roomStats.maintenanceCount,
      total: reservationStats.total,
      newCount: reservationStats.newCount,
      confirmedCount: reservationStats.confirmedCount,
      checkedInCount: reservationStats.checkedInCount,
      checkedOutCount: reservationStats.checkedOutCount,
      cancelledCount: reservationStats.cancelledCount,
      todayArrivals: reservationStats.todayArrivals,
      todayDepartures: reservationStats.todayDepartures,
      reservedUpcoming: reservationStats.reservedUpcoming,
      currentGuests: reservationStats.currentGuests,
    };
  }
}

export const adminService = new AdminService();