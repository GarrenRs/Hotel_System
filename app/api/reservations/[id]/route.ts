import { NextRequest, NextResponse } from 'next/server';
import { reservationService, ReservationConflictError } from '@/services/reservation/reservation.service';
import { ApiResponse } from '@/domain/reservation/types';
import { requireAdminAuth } from '@/lib/admin-auth';
import { logger } from '@/lib/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminCheck = requireAdminAuth(request);
  if (adminCheck) {
    return adminCheck;
  }

  try {
    const { id } = await params;
    const reservation = await reservationService.getReservationById(id);

    if (!reservation) {
      const response: ApiResponse<null> = {
        success: false,
        message: 'Reservation not found.',
        data: null,
      };
      return NextResponse.json(response, { status: 404 });
    }

    const response: ApiResponse<typeof reservation> = {
      success: true,
      message: 'Reservation details retrieved.',
      data: reservation,
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    logger.error('Error fetching reservation details', error);
    const response: ApiResponse<null> = {
      success: false,
      message: 'Failed to fetch reservation.',
      data: null,
      errors: [(error instanceof Error ? error.message : 'Unknown error')],
    };
    return NextResponse.json(response, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminCheck = requireAdminAuth(request);
  if (adminCheck) {
    return adminCheck;
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status) {
      const response: ApiResponse<null> = {
        success: false,
        message: 'Status parameter is required.',
        data: null,
      };
      return NextResponse.json(response, { status: 400 });
    }

    const updated = await reservationService.updateReservationStatus(id, status);
    logger.info('Updated reservation status', { id, status });

    const response: ApiResponse<typeof updated> = {
      success: true,
      message: 'Reservation status updated successfully.',
      data: updated,
    };

    return NextResponse.json(response);
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

    logger.error('Error updating reservation status', error);
    const response: ApiResponse<null> = {
      success: false,
      message: 'Failed to update reservation status.',
      data: null,
      errors: [(error instanceof Error ? error.message : 'Unknown error')],
    };
    return NextResponse.json(response, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminCheck = requireAdminAuth(request);
  if (adminCheck) {
    return adminCheck;
  }

  try {
    const { id } = await params;
    await reservationService.deleteReservation(id);
    logger.info('Deleted reservation', { id });

    const response: ApiResponse<null> = {
      success: true,
      message: 'Reservation deleted successfully.',
      data: null,
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    logger.error('Error deleting reservation', error);
    const response: ApiResponse<null> = {
      success: false,
      message: 'Failed to delete reservation.',
      data: null,
      errors: [(error instanceof Error ? error.message : 'Unknown error')],
    };
    return NextResponse.json(response, { status: 500 });
  }
}