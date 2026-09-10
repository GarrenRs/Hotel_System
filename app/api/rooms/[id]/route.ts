import { NextRequest, NextResponse } from 'next/server';
import { roomService } from '@/services/room/room.service';
import { ApiResponse } from '@/domain/room/types';
import { requireAdminAuth } from '@/lib/admin-auth';
import { toErrorResponse } from '@/lib/api-errors';
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

    const result = await roomService.updateRoomOperationalStatus(id, status);
    logger.info('Updated room operational status', { id, status });

    const response: ApiResponse<typeof result> = {
      success: true,
      message: 'Room status updated successfully.',
      data: result,
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    logger.error('Error updating room status', error);
    return toErrorResponse(error, 'admin');
  }
}