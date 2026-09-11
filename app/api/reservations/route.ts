import { NextRequest, NextResponse } from 'next/server';
import { reservationService } from '@/services/reservation/reservation.service';
import { ApiResponse, CreateReservationInput } from '@/domain/reservation/types';
import { reservationFormSchema } from '@/lib/validations/reservation.schema';
import { requireAdminAuth } from '@/lib/admin-auth';
import { toErrorResponse } from '@/lib/api-errors';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  const adminCheck = requireAdminAuth(request);
  if (adminCheck) {
    return adminCheck;
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const roomType = searchParams.get('roomType') || undefined;
    const searchQuery = searchParams.get('searchQuery') || undefined;

    const reservations = await reservationService.getAllReservations({
      status,
      roomType,
      searchQuery,
    });

    const response: ApiResponse<typeof reservations> = {
      success: true,
      message: 'Reservations retrieved successfully.',
      data: reservations,
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    logger.error('Error fetching reservations', error);
    return toErrorResponse(error, 'admin');
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const parseResult = reservationFormSchema.safeParse(body);
    if (!parseResult.success) {
      const errors = parseResult.error.errors.map((e) => e.message);
      const response: ApiResponse<null> = {
        success: false,
        message: 'Validation failed.',
        data: null,
        errors,
      };
      return NextResponse.json(response, { status: 400 });
    }

    const created = await reservationService.createReservation({
      ...(parseResult.data as CreateReservationInput),
      email: parseResult.data.email ?? '',
    });
    logger.info('Created new reservation request', { id: created.id, reservationId: created.reservationId });

    const response: ApiResponse<typeof created> = {
      success: true,
      message: 'Reservation request created successfully.',
      data: created,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error: unknown) {
    logger.error('Error creating reservation', error);
    return toErrorResponse(error, 'guest');
  }
}