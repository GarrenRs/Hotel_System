import { NextRequest, NextResponse } from 'next/server';
import { roomService } from '@/services/room/room.service';
import { ApiResponse } from '@/domain/room/types';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const roomType = searchParams.get('roomType') || undefined;
    const searchQuery = searchParams.get('searchQuery') || undefined;

    const rooms = await roomService.getAllRooms({
      status,
      roomType,
      searchQuery,
    });

    const response: ApiResponse<typeof rooms> = {
      success: true,
      message: 'Rooms retrieved successfully.',
      data: rooms,
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    logger.error('Error fetching rooms', error);
    const response: ApiResponse<null> = {
      success: false,
      message: 'Failed to fetch rooms.',
      data: null,
      errors: [(error instanceof Error ? error.message : 'Unknown error') || 'Server Error'],
    };
    return NextResponse.json(response, { status: 500 });
  }
}