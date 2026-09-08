'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { adminLoginSchema, AdminLoginValues } from '@/lib/validations/reservation.schema';
import { useLanguage } from '@/components/providers/LanguageContext';
import { Lock, User, AlertCircle } from 'lucide-react';
import { HOTEL } from '@/config/hotel';

export const AdminLoginCard: React.FC = () => {
  const { t } = useLanguage();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdminLoginValues>({
    resolver: zodResolver(adminLoginSchema),
  });

  const onSubmit = async (data: AdminLoginValues) => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.errors?.[0] || result.message || 'Invalid credentials');
      }

      router.push('/admin/dashboard');
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : t('errors.invalidCredentials'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 shadow-2xl border border-[#B99246]/30 space-y-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#B99246] via-[#D4AF37] to-[#8C6D27]" />

      <div className="text-center space-y-3">
        <div className="relative w-44 h-12 mx-auto">
          <Image
            src="/images/logo/logo.png"
            alt={`${HOTEL.name} Logo`}
            fill
            sizes="150px"
            className="object-contain"
          />
        </div>
        <h1 className="text-xl font-bold text-[#111111]">
          {t('admin.loginTitle')}
        </h1>
        <p className="text-xs text-[#333333]/70">
          {t('admin.loginSubtitle')}
        </p>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-2xl text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-[#111111] mb-1.5 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-[#B99246]" />
            <span>{t('admin.username')}</span>
          </label>
          <input
            type="text"
            {...register('username')}
            className="w-full px-4 py-3 rounded-2xl border border-[#EAEAEA] bg-[#FAF9F7] text-xs focus:outline-none focus:border-[#B99246]"
          />
          {errors.username && (
            <p className="text-[11px] text-rose-500 mt-1">{t(errors.username.message || '')}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#111111] mb-1.5 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-[#B99246]" />
            <span>{t('admin.password')}</span>
          </label>
          <input
            type="password"
            {...register('password')}
            className="w-full px-4 py-3 rounded-2xl border border-[#EAEAEA] bg-[#FAF9F7] text-xs focus:outline-none focus:border-[#B99246]"
          />
          {errors.password && (
            <p className="text-[11px] text-rose-500 mt-1">{t(errors.password.message || '')}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 rounded-2xl bg-[#B99246] text-[#111111] font-bold text-xs uppercase tracking-widest hover:bg-[#D4AF37] transition-all cursor-pointer shadow-lg shadow-[#B99246]/20 disabled:opacity-50"
        >
          {isSubmitting ? '...' : t('admin.loginButton')}
        </button>
      </form>

      <div className="text-center pt-1 text-[11px] text-[#333333]/50">
        {t('admin.secureAccess')}
      </div>
    </div>
  );
};