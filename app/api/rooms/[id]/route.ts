import { NextRequest, NextResponse } from 'next/server';
import { roomService } from '@/services/room/room.service';
import { ApiResponse } from '@/domain/room/types';
import { requireAdminAuth } from '@/lib/admin-auth';
import { logger } from '@/lib/logger';

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

    const updated = await roomService.updateRoomStatus(id, status);
    logger.info('Updated room status', { id, status });

    const response: ApiResponse<typeof updated> = {
      success: true,
      message: 'Room status updated successfully.',
      data: updated,
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    logger.error('Error updating room status', error);
    const response: ApiResponse<null> = {
      success: false,
      message: 'Failed to update room status.',
      data: null,
      errors: [(error instanceof Error ? error.message : 'Unknown error')],
    };
    return NextResponse.json(response, { status: 500 });
  }
}