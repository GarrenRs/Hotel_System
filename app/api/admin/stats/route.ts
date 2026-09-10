import { NextRequest, NextResponse } from 'next/server';
import { adminService } from '@/services/admin/admin.service';
import { ApiResponse, AdminStats } from '@/domain/reservation/types';
import { requireAdminAuth } from '@/lib/admin-auth';
import { toErrorResponse } from '@/lib/api-errors';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  const adminCheck = requireAdminAuth(request);
  if (adminCheck) {
    return adminCheck;
  }

  try {
    const stats = await adminService.getDashboardStats();
    const response: ApiResponse<AdminStats> = {
      success: true,
      message: 'Stats retrieved successfully.',
      data: stats,
    };
    return NextResponse.json(response);
  } catch (error: unknown) {
    logger.error('Error fetching admin dashboard stats', error);
    return toErrorResponse(error, 'admin');
  }
}