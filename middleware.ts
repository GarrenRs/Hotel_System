import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_TOKEN_COOKIE } from '@/lib/session';

function base64UrlToBytes(value: string): Uint8Array {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function verifyAdminToken(token: string): Promise<boolean> {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return false;
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return false;
  }

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );

  const expectedSignature = base64UrlToBytes(parts[2]);
  const isValid = await crypto.subtle.verify(
    'HMAC',
    key,
    expectedSignature as BufferSource,
    encoder.encode(`${parts[0]}.${parts[1]}`) as BufferSource
  );

  if (!isValid) {
    return false;
  }

  try {
    const payloadJson = new TextDecoder().decode(base64UrlToBytes(parts[1]));
    const payload = JSON.parse(payloadJson) as { exp?: number };
    return typeof payload.exp === 'number' && payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const adminToken = request.cookies.get(ADMIN_TOKEN_COOKIE)?.value ?? null;
    const adminVerified = adminToken ? await verifyAdminToken(adminToken) : false;
    if (!adminVerified) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/admin/login';
      loginUrl.search = '';
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};