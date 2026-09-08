import React from 'react';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { AdminLoginCard } from '@/components/admin/AdminLoginCard';

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-[#111111] flex items-center justify-center p-4 relative">
      <div className="absolute top-6 end-6">
        <LanguageSwitcher />
      </div>

      <AdminLoginCard />
    </div>
  );
}