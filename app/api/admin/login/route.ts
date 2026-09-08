import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { adminLoginSchema } from '@/lib/validations/reservation.schema';
import { ApiResponse } from '@/domain/reservation/types';
import { env } from '@/lib/env';
import { ADMIN_TOKEN_COOKIE } from '@/lib/session';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parseResult = adminLoginSchema.safeParse(body);

    if (!parseResult.success) {
      const response: ApiResponse<null> = {
        success: false,
        message: 'Invalid input.',
        data: null,
        errors: parseResult.error.errors.map((e) => e.message),
      };
      return NextResponse.json(response, { status: 400 });
    }

    const { username, password } = parseResult.data;

    const envUsername = env.ADMIN_USERNAME;
    const envPassword = env.ADMIN_PASSWORD;
    const jwtSecret = env.JWT_SECRET;

    if (username !== envUsername || password !== envPassword) {
      logger.warn('Failed admin login attempt', { username });
      const response: ApiResponse<null> = {
        success: false,
        message: 'Invalid credentials.',
        data: null,
        errors: ['Invalid username or password.'],
      };
      return NextResponse.json(response, { status: 401 });
    }

    const token = jwt.sign({ username, role: 'ADMIN' }, jwtSecret, { expiresIn: '1d' });
    logger.info('Successful admin login', { username });

    const res = NextResponse.json({
      success: true,
      message: 'Login successful.',
      data: { username },
    } as ApiResponse<{ username: string }>);

    res.cookies.set(ADMIN_TOKEN_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/',
    });

    return res;
  } catch (error: unknown) {
    logger.error('Error during admin login', error);
    const response: ApiResponse<null> = {
      success: false,
      message: 'Server error during authentication.',
      data: null,
      errors: [(error instanceof Error ? error.message : 'Unknown error')],
    };
    return NextResponse.json(response, { status: 500 });
  }
}
