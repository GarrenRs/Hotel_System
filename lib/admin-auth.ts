import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { env } from '@/lib/env';
import { ADMIN_TOKEN_COOKIE } from '@/lib/session';
import { ApiResponse } from '@/domain/reservation/types';

export function isAdminAuthenticated(request: NextRequest): boolean {
  const token = request.cookies.get(ADMIN_TOKEN_COOKIE)?.value ?? null;
  if (!token) {
    return false;
  }

  try {
    jwt.verify(token, env.JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}

export function adminUnauthorizedResponse(): NextResponse<ApiResponse<null>> {
  const response: ApiResponse<null> = {
    success: false,
    message: 'Unauthorized. Admin login required.',
    data: null,
    errors: ['Admin authentication required.'],
  };
  return NextResponse.json(response, { status: 401 });
}

export function requireAdminAuth(request: NextRequest): NextResponse<ApiResponse<null>> | null {
  if (isAdminAuthenticated(request)) {
    return null;
  }
  return adminUnauthorizedResponse();
}