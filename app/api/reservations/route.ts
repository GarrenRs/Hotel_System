import { NextRequest, NextResponse } from 'next/server';
import { reservationService, ReservationConflictError } from '@/services/reservation/reservation.service';
import { roomService } from '@/services/room/room.service';
import { reservationFormSchema } from '@/lib/validations/reservation.schema';
import { RoomStatus } from '@/domain/room/enums';
import { ApiResponse, CreateReservationInput } from '@/domain/reservation/types';
import { requireAdminAuth } from '@/lib/admin-auth';
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
    const response: ApiResponse<null> = {
      success: false,
      message: 'Failed to fetch reservations.',
      data: null,
      errors: [(error instanceof Error ? error.message : 'Unknown error') || 'Server Error'],
    };
    return NextResponse.json(response, { status: 500 });
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

    const { roomId } = parseResult.data;

    const room = roomId ? await roomService.getRoomById(roomId) : null;
    if (!room) {
      const response: ApiResponse<null> = {
        success: false,
        message: 'Selected room not found.',
        data: null,
        errors: ['The selected room does not exist.'],
      };
      return NextResponse.json(response, { status: 400 });
    }

    if (room.roomType !== parseResult.data.roomType) {
      const response: ApiResponse<null> = {
        success: false,
        message: 'Selected room does not match the requested room type.',
        data: null,
        errors: ['The selected room does not match the requested room type.'],
      };
      return NextResponse.json(response, { status: 400 });
    }

    if (room.status !== RoomStatus.AVAILABLE) {
      const response: ApiResponse<null> = {
        success: false,
        message: 'Selected room is not currently available.',
        data: null,
        errors: ['Selected room is not currently available.'],
      };
      return NextResponse.json(response, { status: 400 });
    }

    const created = await reservationService.createReservation(parseResult.data as CreateReservationInput);
    logger.info('Created new reservation request', { id: created.id, reservationId: created.reservationId });

    const response: ApiResponse<typeof created> = {
      success: true,
      message: 'Reservation request created successfully.',
      data: created,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof ReservationConflictError) {
      const response: ApiResponse<null> = {
        success: false,
        message: 'Room is not available for the selected dates.',
        data: null,
        errors: [error.message],
      };
      return NextResponse.json(response, { status: 400 });
    }

    logger.error('Error creating reservation', error);
    const response: ApiResponse<null> = {
      success: false,
      message: 'Failed to create reservation.',
      data: null,
      errors: [(error instanceof Error ? error.message : 'Unknown error') || 'Server Error'],
    };
    return NextResponse.json(response, { status: 500 });
  }
}