
'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import * as adminApi from '@/lib/api/admin';
import { User } from '@/lib/types/auth';
import { PaginatedResponse } from '@/lib/types/api';
import { formatDate } from '@/lib/utils/helpers';
import { HiDownload } from 'react-icons/hi';
import { showSuccess, showError } from '@/lib/utils/toast';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  const [exportLoading, setExportLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRole, setNewRole] = useState<'STUDENT' | 'INSTRUCTOR'>('STUDENT');
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, debouncedSearch]);

  // Debounce search term so we don't hammer the API on every keystroke
  useEffect(() => {
    const id = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 400);
    return () => clearTimeout(id);
  }, [search]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data: PaginatedResponse<User> = await adminApi.getAllUsers({
        page: pagination.page,
        limit: pagination.limit,
        search: debouncedSearch || undefined,
      });
      setUsers(data?.data || []);
      setPagination(data?.pagination || { page: 1, limit: 10, total: 0, pages: 0 });
    } catch (error) {
      console.error('Error fetching users:', error);
      // Set empty array on error to prevent undefined errors
      setUsers([]);
      setPagination({ page: 1, limit: 10, total: 0, pages: 0 });
      showError(Object(error).message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleBlock = async (userId: string, isActive: boolean) => {
    try {
      if (isActive) {
        await adminApi.blockUser(userId);
        showSuccess('User blocked successfully');
      } else {
        await adminApi.unblockUser(userId);
        showSuccess('User unblocked successfully');
      }
      fetchUsers();
    } catch (error) {
      showError(Object(error).message || 'Operation failed');
    }
  };

  const handleExportUsers = async () => {
    try {
      setExportLoading(true);
      const allUsers: User[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const data = await adminApi.getAllUsers({
          page,
          limit: 500,
          search: search || undefined,
        });
        allUsers.push(...(data?.data || []));
        hasMore = page < (data?.pagination?.pages ?? 1);
        page += 1;
      }

      const headers = ['Name', 'Email', 'Phone', 'Role', 'Status', 'Joined'];
      const rows = allUsers.map((u) => [
        u.fullName ?? '',
        u.email ?? '',
        u.phone ?? '',
        u.role ?? '',
        u.isActive ? 'Active' : 'Blocked',
        u.createdAt ? formatDate(u.createdAt) : '',
      ]);
      const csvContent = [headers.join(','), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showSuccess('Users exported successfully');
    } catch (error) {
      showError(Object(error).message || 'Failed to export users');
    } finally {
      setExportLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!newFullName.trim() || !newEmail.trim() || !newPassword.trim()) {
      setCreateError('Name, email and password are required.');
      return;
    }
    try {
      setCreateError(null);
      setCreating(true);
      await adminApi.createUser({
        fullName: newFullName.trim(),
        email: newEmail.trim(),
        password: newPassword,
        phone: newPhone.trim() || undefined,
        role: newRole,
      });
      setNewFullName('');
      setNewEmail('');
      setNewPassword('');
      setNewPhone('');
      setNewRole('STUDENT');
      await fetchUsers();
      showSuccess('User created successfully. Share the email and password with the user so they can log in.');
    } catch (error) {
      const msg = Object(error).message || 'Failed to create user';
      setCreateError(msg);
      showError(msg);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <div className="mb-8 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[var(--foreground)]">User Management</h1>
            <p className="text-[var(--muted-foreground)] mt-2">Manage all users and create login credentials for students.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
              }}
              className="max-w-md"
            />
            <Button
              variant="outline"
              onClick={handleExportUsers}
              disabled={exportLoading}
              className="shrink-0"
            >
              <HiDownload className="w-4 h-4 mr-2" />
              {exportLoading ? 'Exporting…' : 'Export Users'}
            </Button>
          </div>
        </div>

        <Card padding="md" className="space-y-3">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Create User With Credentials</h2>
          <p className="text-sm text-[var(--muted-foreground)]">
            Use this form to create a user and share email/password with them so they can log in directly without OTP.
          </p>
          {createError && (
            <div className="rounded border border-[var(--error)] bg-red-50 px-3 py-2 text-sm text-[var(--error)]">
              {createError}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <Input
              label="Full Name"
              value={newFullName}
              onChange={(e) => setNewFullName(e.target.value)}
              placeholder="Student full name"
            />
            <Input
              label="Email"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="student@example.com"
            />
            <Input
              label="Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Strong password"
            />
            <Input
              label="Phone (optional)"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              placeholder="+9779XXXXXXXXX"
            />
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Role</label>
              <select
                className="block w-full rounded-none border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)]"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as 'STUDENT' | 'INSTRUCTOR')}
              >
                <option value="STUDENT">Student</option>
                <option value="INSTRUCTOR">Instructor</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end">
            <Button variant="primary" onClick={handleCreateUser} disabled={creating}>
              {creating ? 'Creating…' : 'Create User'}
            </Button>
          </div>
        </Card>
      </div>

      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[var(--muted)]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--foreground)] uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--foreground)] uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--foreground)] uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--foreground)] uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--foreground)] uppercase">Joined</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--foreground)] uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center">Loading...</td>
                </tr>
              ) : users && users.length > 0 ? (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-[var(--muted)]">
                    <td className="px-6 py-4 whitespace-nowrap">{user.fullName}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-none text-xs ${
                        user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                        user.role === 'INSTRUCTOR' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-none text-xs ${
                        user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {user.isActive ? 'Active' : 'Blocked'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--muted-foreground)]">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.role !== 'ADMIN' && (
                        <Button
                          variant={user.isActive ? 'danger' : 'primary'}
                          size="sm"
                          onClick={() => handleBlock(user.id, user.isActive)}
                        >
                          {user.isActive ? 'Block' : 'Unblock'}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-[var(--muted-foreground)]">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-[var(--border)] flex justify-between items-center">
            <div className="text-sm text-[var(--muted-foreground)]">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} users
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                disabled={pagination.page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                disabled={pagination.page >= pagination.pages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

