'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/context/AuthContext';
import * as authApi from '@/lib/api/auth';
import type { User } from '@/lib/types/auth';
import { showSuccess, showError } from '@/lib/utils/toast';
import { HiKey, HiUser, HiCreditCard } from 'react-icons/hi';

const PAYMENT_METHODS = [
  { value: '', label: 'Not set' },
  { value: 'ESEWA', label: 'eSewa' },
  { value: 'MOBILE_BANKING', label: 'Mobile Banking' },
  { value: 'VISA_CARD', label: 'Visa Card' },
  { value: 'MASTERCARD', label: 'Mastercard' },
] as const;

type ProfileFormData = {
  fullName: string;
  phone: string;
};

type PasswordFormData = {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
};

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    reset: resetProfile,
    formState: { errors: profileErrors },
  } = useForm<ProfileFormData>();

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPassword,
    watch,
    setError: setPasswordError,
    formState: { errors: passwordErrors },
  } = useForm<PasswordFormData>();

  const newPassword = watch('newPassword');

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const data = await authApi.getProfile();
      setProfile(data);
      setPaymentMethod(data.preferredPaymentMethod ?? '');
      resetProfile({
        fullName: data.fullName ?? '',
        phone: data.phone ?? '',
      });
    } catch (e) {
      showError(e instanceof Error ? e.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [resetProfile]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const onUpdateProfile = async (data: ProfileFormData) => {
    setSavingProfile(true);
    try {
      await authApi.updateProfile({
        fullName: data.fullName.trim(),
        phone: data.phone.trim() || null,
      });
      await refreshUser();
      setProfile((prev) => (prev ? { ...prev, fullName: data.fullName.trim(), phone: data.phone.trim() || null } : null));
      showSuccess('Profile updated successfully');
    } catch (e) {
      showError(e instanceof Error ? e.message : 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const onPaymentPreferenceChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setPaymentMethod(value);
    if (!value) return;
    setSavingPayment(true);
    try {
      await authApi.updatePaymentPreference(value);
      showSuccess('Payment preference updated');
    } catch (e) {
      showError(e instanceof Error ? e.message : 'Failed to update payment preference');
      setPaymentMethod(profile?.preferredPaymentMethod ?? '');
    } finally {
      setSavingPayment(false);
    }
  };

  const onChangePassword = async (data: PasswordFormData) => {
    if (data.newPassword !== data.confirmNewPassword) {
      setPasswordError('confirmNewPassword', { message: 'Passwords do not match' });
      return;
    }
    setChangingPassword(true);
    try {
      await authApi.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      showSuccess('Password changed successfully');
      resetPassword();
    } catch (e) {
      showError(e instanceof Error ? e.message : 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-[var(--foreground)] mb-8">Settings</h1>
        <Card padding="lg" className="flex items-center justify-center py-12">
          <div className="inline-block w-8 h-8 border-2 border-[var(--primary-700)] border-t-transparent rounded-full animate-spin" />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-[var(--foreground)]">Settings</h1>

      {/* Profile */}
      <Card padding="lg">
        <div className="flex items-center gap-2 mb-6">
          <HiUser className="w-5 h-5 text-[var(--primary-700)]" />
          <h2 className="text-xl font-semibold text-[var(--foreground)]">Profile</h2>
        </div>
        <form onSubmit={handleSubmitProfile(onUpdateProfile)} className="space-y-4 max-w-md">
          <div>
            <label htmlFor="profile-fullName" className="block text-sm font-medium text-[var(--foreground)] mb-1">
              Full name
            </label>
            <input
              id="profile-fullName"
              type="text"
              {...registerProfile('fullName', { required: 'Full name is required', maxLength: { value: 255, message: 'Max 255 characters' } })}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-[var(--primary-500)] focus:border-transparent"
              placeholder="Your name"
            />
            {profileErrors.fullName && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{profileErrors.fullName.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="profile-email" className="block text-sm font-medium text-[var(--foreground)] mb-1">
              Email
            </label>
            <input
              id="profile-email"
              type="email"
              value={profile?.email ?? ''}
              readOnly
              disabled
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--muted)]/50 text-[var(--muted-foreground)] cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">Email cannot be changed here.</p>
          </div>
          <div>
            <label htmlFor="profile-phone" className="block text-sm font-medium text-[var(--foreground)] mb-1">
              Phone
            </label>
            <input
              id="profile-phone"
              type="tel"
              {...registerProfile('phone', { maxLength: { value: 50, message: 'Max 50 characters' } })}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-[var(--primary-500)] focus:border-transparent"
              placeholder="Optional"
            />
            {profileErrors.phone && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{profileErrors.phone.message}</p>
            )}
          </div>
          <Button type="submit" variant="primary" size="md" disabled={savingProfile}>
            {savingProfile ? 'Saving...' : 'Save profile'}
          </Button>
        </form>
      </Card>

      {/* Payment preference */}
      <Card padding="lg">
        <div className="flex items-center gap-2 mb-6">
          <HiCreditCard className="w-5 h-5 text-[var(--primary-700)]" />
          <h2 className="text-xl font-semibold text-[var(--foreground)]">Payment preference</h2>
        </div>
        <p className="text-sm text-[var(--muted-foreground)] mb-4">
          Choose your default payment method for future purchases.
        </p>
        <div className="max-w-xs">
          <select
            value={paymentMethod}
            onChange={onPaymentPreferenceChange}
            disabled={savingPayment}
            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-[var(--primary-500)] focus:border-transparent"
          >
            {PAYMENT_METHODS.map((opt) => (
              <option key={opt.value || 'empty'} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {savingPayment && <p className="mt-2 text-sm text-[var(--muted-foreground)]">Saving...</p>}
        </div>
      </Card>

      {/* Change password */}
      <Card padding="lg">
        <div className="flex items-center gap-2 mb-2">
          <HiKey className="w-5 h-5 text-[var(--primary-700)]" />
          <h2 className="text-xl font-semibold text-[var(--foreground)]">Change password</h2>
        </div>
        <p className="text-sm text-[var(--muted-foreground)] mb-6">
          Enter your current password and choose a new one (at least 6 characters).
        </p>
        <form onSubmit={handleSubmitPassword(onChangePassword)} className="space-y-4 max-w-md">
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-[var(--foreground)] mb-1">
              Current password
            </label>
            <input
              id="currentPassword"
              type="password"
              autoComplete="current-password"
              {...registerPassword('currentPassword', { required: 'Current password is required' })}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-[var(--primary-500)] focus:border-transparent"
              placeholder="••••••••"
            />
            {passwordErrors.currentPassword && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{passwordErrors.currentPassword.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-[var(--foreground)] mb-1">
              New password
            </label>
            <input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              {...registerPassword('newPassword', { required: 'New password is required', minLength: { value: 6, message: 'At least 6 characters' } })}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-[var(--primary-500)] focus:border-transparent"
              placeholder="••••••••"
            />
            {passwordErrors.newPassword && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{passwordErrors.newPassword.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-[var(--foreground)] mb-1">
              Confirm new password
            </label>
            <input
              id="confirmNewPassword"
              type="password"
              autoComplete="new-password"
              {...registerPassword('confirmNewPassword', {
                required: 'Please confirm your new password',
                validate: (v) => v === newPassword || 'Passwords do not match',
              })}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-[var(--primary-500)] focus:border-transparent"
              placeholder="••••••••"
            />
            {passwordErrors.confirmNewPassword && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{passwordErrors.confirmNewPassword.message}</p>
            )}
          </div>
          <Button type="submit" variant="primary" size="md" disabled={changingPassword}>
            {changingPassword ? 'Updating...' : 'Change password'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
