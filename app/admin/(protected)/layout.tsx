'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { useLanguage } from '@/components/providers/LanguageContext';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { LayoutDashboard, CalendarCheck, DoorOpen, Settings, LogOut } from 'lucide-react';
import { HOTEL } from '@/config/hotel';

export default function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      router.push('/admin/login');
    } catch (err) {
      console.error(err);
    }
  };

  const navItems = [
    { href: '/admin/dashboard', label: t('admin.dashboard'), icon: LayoutDashboard },
    { href: '/admin/reservations', label: t('admin.reservations'), icon: CalendarCheck },
    { href: '/admin/rooms', label: t('admin.rooms'), icon: DoorOpen },
    { href: '/admin/settings', label: t('admin.settings'), icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#FAF9F7] flex flex-col">
      {/* Top Admin Header */}
      <header className="bg-[#111111] text-white border-b border-[#B99246]/30 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/admin/dashboard" className="relative w-36 h-10">
              <Image
                src="/images/logo/logo.png"
                alt={`${HOTEL.name} Admin`}
                fill
                sizes="150px"
                className="object-contain"
              />
            </Link>

            <nav className="hidden md:flex items-center gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-[#B99246] text-[#111111]'
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-rose-500/30 text-rose-400 text-xs font-semibold hover:bg-rose-500/10 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('admin.logout')}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
