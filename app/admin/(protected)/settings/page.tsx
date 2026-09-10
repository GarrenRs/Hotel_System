'use client';

import React from 'react';
import { useLanguage } from '@/components/providers/LanguageContext';
import { HOTEL } from '@/config/hotel';
import { ShieldCheck, Server, Database, KeyRound } from 'lucide-react';

export default function AdminSettingsPage() {
  const { t } = useLanguage();

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      <div className="border-b border-[#CBC4B6] pb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#111111]">
          {t('admin.settings')}
        </h1>
        <p className="text-xs text-[#333333]/70">
          {t('admin.settingsData.subtitle')}
        </p>
      </div>

      <div className="bg-white rounded-3xl p-8 border border-[#CBC4B6] shadow-luxury space-y-6">
        <h2 className="text-base font-bold text-[#111111] flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#B99246]" />
          <span>{t('admin.settingsData.systemConfig')}</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-[#FAF9F7] border border-[#CBC4B6] space-y-1">
            <span className="text-[#333333]/60 font-semibold">{t('admin.settingsData.hotelName')}</span>
            <div className="font-bold text-[#111111]">{HOTEL.fullName}</div>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF9F7] border border-[#CBC4B6] space-y-1">
            <span className="text-[#333333]/60 font-semibold">{t('admin.settingsData.location')}</span>
            <div className="font-bold text-[#111111]">{HOTEL.location}</div>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF9F7] border border-[#CBC4B6] space-y-1">
            <span className="text-[#333333]/60 font-semibold">{t('admin.settingsData.database')}</span>
            <div className="font-bold text-[#111111] flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span>SQLite ORM (Prisma Repository Pattern)</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF9F7] border border-[#CBC4B6] space-y-1">
            <span className="text-[#333333]/60 font-semibold">{t('admin.settingsData.systemMode')}</span>
            <div className="font-bold text-[#111111] flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-blue-600" />
              <span>Next.js 15 Production Engine</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
