import { NextRequest, NextResponse } from 'next/server';
import { reservationService } from '@/services/reservation/reservation.service';
import { ApiResponse, ReservationStats } from '@/domain/reservation/types';
import { requireAdminAuth } from '@/lib/admin-auth';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  const adminCheck = requireAdminAuth(request);
  if (adminCheck) {
    return adminCheck;
  }

  try {
    const stats = await reservationService.getReservationStats();
    const response: ApiResponse<ReservationStats> = {
      success: true,
      message: 'Stats retrieved successfully.',
      data: stats,
    };
    return NextResponse.json(response);
  } catch (error: unknown) {
    logger.error('Error fetching admin reservation stats', error);
    const response: ApiResponse<null> = {
      success: false,
      message: 'Failed to fetch reservation stats.',
      data: null,
      errors: [(error instanceof Error ? error.message : 'Unknown error')],
    };
    return NextResponse.json(response, { status: 500 });
  }
}