import { NextResponse } from 'next/server';
import { ApiResponse } from '@/domain/reservation/types';
import { ADMIN_TOKEN_COOKIE } from '@/lib/session';

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: 'Logged out successfully.',
    data: null,
  } as ApiResponse<null>);

  response.cookies.delete(ADMIN_TOKEN_COOKIE);
  return response;
}
