import { NextRequest, NextResponse } from 'next/server';
import { roomService } from '@/services/room/room.service';
import { ApiResponse } from '@/domain/room/types';
import { logger } from '@/lib/logger';

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isValidDateString(value: string): boolean {
  if (!ISO_DATE_PATTERN.test(value)) {
    return false;
  }
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime());
}

/**
 * Public availability query (ST-001 §E, ST-002). Returns the rooms the shared
 * offer rule says can be sold for [arrival, departure). The guest form calls
 * this instead of filtering by `status === AVAILABLE` on the client.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const arrivalDate = searchParams.get('arrival') || '';
    const departureDate = searchParams.get('departure') || '';
    const roomType = searchParams.get('roomType') || undefined;

    if (!isValidDateString(arrivalDate) || !isValidDateString(departureDate)) {
      const response: ApiResponse<null> = {
        success: false,
        message: 'validation.invalidDateFormat',
        data: null,
        errors: ['validation.invalidDateFormat'],
      };
      return NextResponse.json(response, { status: 400 });
    }

    if (arrivalDate >= departureDate) {
      const response: ApiResponse<null> = {
        success: false,
        message: 'validation.departureAfterArrival',
        data: null,
        errors: ['validation.departureAfterArrival'],
      };
      return NextResponse.json(response, { status: 400 });
    }

    const rooms = await roomService.getAvailableRoomsForPeriod({
      arrivalDate,
      departureDate,
      roomType: roomType && roomType !== 'ALL' ? roomType : undefined,
    });

    const response: ApiResponse<typeof rooms> = {
      success: true,
      message: 'Available rooms retrieved successfully.',
      data: rooms,
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    logger.error('Error fetching available rooms', error);
    const response: ApiResponse<null> = {
      success: false,
      message: 'errors.serverError',
      data: null,
      errors: ['errors.serverError'],
    };
    return NextResponse.json(response, { status: 500 });
  }
}