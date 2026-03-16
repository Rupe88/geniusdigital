'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import * as adminApi from '@/lib/api/admin';
import * as courseApi from '@/lib/api/courses';
import { certificatesApi, type Certificate } from '@/lib/api/certificates';
import { User } from '@/lib/types/auth';
import { Course } from '@/lib/types/course';
import { PaginatedResponse } from '@/lib/types/api';
import { formatDate } from '@/lib/utils/helpers';
import { showError, showSuccess } from '@/lib/utils/toast';

export default function AdminCertificatesPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [debouncedUserSearch, setDebouncedUserSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  const [courses, setCourses] = useState<Course[]>([]);
  const [courseSearch, setCourseSearch] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');

  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loadingCertificates, setLoadingCertificates] = useState(true);

  // Debounce user search input
  useEffect(() => {
    const id = setTimeout(() => {
      setDebouncedUserSearch(userSearch.trim());
    }, 400);
    return () => clearTimeout(id);
  }, [userSearch]);

  useEffect(() => {
    // Load users matching current search and initial courses list
    const run = async () => {
      try {
        const [usersRes, coursesRes] = await Promise.all([
          adminApi
            .getAllUsers({ page: 1, limit: 50, search: debouncedUserSearch || undefined })
            .catch(
              () =>
                ({ data: [], pagination: { page: 1, limit: 50, total: 0, pages: 0 } } as PaginatedResponse<User>)
            ),
          courseApi
            .getAllCourses({ page: 1, limit: 100 })
            .catch(
              () =>
                ({ data: [], pagination: { page: 1, limit: 100, total: 0, pages: 0 } } as PaginatedResponse<Course>)
            ),
        ]);
        setUsers(usersRes.data ?? []);
        setCourses(coursesRes.data ?? []);
      } catch (error) {
        console.error('Error loading users/courses:', error);
        showError('Failed to load users or courses');
      }
    };
    run();
  }, [debouncedUserSearch]);

  useEffect(() => {
    const run = async () => {
      try {
        setLoadingCertificates(true);
        const data = await certificatesApi.getAll();
        setCertificates(data);
      } catch (error) {
        console.error('Error loading certificates:', error);
        showError('Failed to load certificates');
      } finally {
        setLoadingCertificates(false);
      }
    };
    run();
  }, []);

  // Users are already filtered server-side by debouncedUserSearch
  const filteredUsers = users;

  const filteredCourses = useMemo(
    () =>
      courses.filter((c) => {
        const q = courseSearch.toLowerCase();
        return !q || c.title?.toLowerCase().includes(q);
      }),
    [courses, courseSearch]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) {
      setFile(null);
      return;
    }
    // Basic validation: only allow PDFs and images
    const allowed = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
    ];
    if (!allowed.includes(f.type)) {
      showError('Only PDF and image files (JPG, PNG, WEBP) are allowed');
      e.target.value = '';
      setFile(null);
      return;
    }
    setFile(f);
  };

  const handleIssueAndUpload = async () => {
    if (!selectedUserId || !selectedCourseId) {
      showError('Please select a user and a course');
      return;
    }
    if (!file) {
      showError('Please choose a certificate file to upload');
      return;
    }

    try {
      setUploading(true);

      // 1) Ensure a certificate exists (and user is eligible)
      const issued = await certificatesApi.issue({
        userId: selectedUserId,
        courseId: selectedCourseId,
      });

      // 2) Upload the actual signed certificate file
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', selectedUserId);
      formData.append('courseId', selectedCourseId);

      const uploaded = await certificatesApi.upload(formData);

      setCertificates((prev) => {
        const existingIndex = prev.findIndex((c) => c.id === uploaded.id);
        if (existingIndex >= 0) {
          const copy = [...prev];
          copy[existingIndex] = uploaded;
          return copy;
        }
        return [uploaded, ...prev];
      });

      showSuccess('Certificate issued and file uploaded successfully');
      setFile(null);
    } catch (error) {
      showError(
        Object(error).message || 'Failed to issue or upload certificate'
      );
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this certificate?')) {
      return;
    }
    try {
      await certificatesApi.delete(id);
      setCertificates((prev) => prev.filter((c) => c.id !== id));
      showSuccess('Certificate deleted');
    } catch (error) {
      showError(Object(error).message || 'Failed to delete certificate');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[var(--foreground)]">Certificates</h1>
        <p className="text-[var(--muted-foreground)] mt-2">
          Issue and upload signed certificates for students after they complete courses.
        </p>
      </div>

      <Card padding="lg" className="space-y-4">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">Issue & Upload Certificate</h2>
        <p className="text-sm text-[var(--muted-foreground)]">
          Select a student and a course, then upload the finalized certificate file (PDF or image).
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Input
              label="Search Student"
              placeholder="Search by name or email"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
            />
            <div className="mt-2 max-h-44 overflow-y-auto border border-[var(--border)] rounded-none bg-[var(--background)]">
              {filteredUsers.length === 0 ? (
                <p className="text-xs text-[var(--muted-foreground)] px-3 py-2">
                  No users found.
                </p>
              ) : (
                <ul className="text-sm">
                  {filteredUsers.map((u) => (
                    <li
                      key={u.id}
                      className={`px-3 py-2 cursor-pointer hover:bg-[var(--muted)] ${
                        selectedUserId === u.id ? 'bg-[var(--muted)] font-semibold' : ''
                      }`}
                      onClick={() => setSelectedUserId(u.id)}
                    >
                      <div>{u.fullName || u.email}</div>
                      <div className="text-[11px] text-[var(--muted-foreground)]">
                        {u.email}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div>
            <Input
              label="Search Course"
              placeholder="Search by title"
              value={courseSearch}
              onChange={(e) => setCourseSearch(e.target.value)}
            />
            <div className="mt-2 max-h-44 overflow-y-auto border border-[var(--border)] rounded-none bg-[var(--background)]">
              {filteredCourses.length === 0 ? (
                <p className="text-xs text-[var(--muted-foreground)] px-3 py-2">
                  No courses found.
                </p>
              ) : (
                <ul className="text-sm">
                  {filteredCourses.map((c) => (
                    <li
                      key={c.id}
                      className={`px-3 py-2 cursor-pointer hover:bg-[var(--muted)] ${
                        selectedCourseId === c.id ? 'bg-[var(--muted)] font-semibold' : ''
                      }`}
                      onClick={() => setSelectedCourseId(c.id)}
                    >
                      <div>{c.title}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-[var(--foreground)]">
              Certificate File
            </label>
            <input
              type="file"
              accept="application/pdf,image/*"
              onChange={handleFileChange}
              className="block w-full text-sm text-[var(--foreground)]"
            />
            {file && (
              <p className="text-xs text-[var(--muted-foreground)]">
                Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
            <Button
              variant="primary"
              className="mt-2"
              onClick={handleIssueAndUpload}
              disabled={uploading}
            >
              {uploading ? 'Uploading…' : 'Issue & Upload Certificate'}
            </Button>
          </div>
        </div>
      </Card>

      <Card padding="lg" className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">All Certificates</h2>
          <p className="text-xs text-[var(--muted-foreground)]">
            Total: {certificates.length}
          </p>
        </div>

        {loadingCertificates ? (
          <p className="text-sm text-[var(--muted-foreground)]">Loading certificates...</p>
        ) : certificates.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)]">
            No certificates have been issued yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--muted)]">
                  <th className="text-left px-3 py-2 font-medium">Student</th>
                  <th className="text-left px-3 py-2 font-medium">Course</th>
                  <th className="text-left px-3 py-2 font-medium">Certificate ID</th>
                  <th className="text-left px-3 py-2 font-medium">Issued At</th>
                  <th className="text-left px-3 py-2 font-medium">File</th>
                  <th className="text-right px-3 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {certificates.map((cert) => (
                  <tr key={cert.id} className="border-b border-[var(--border)] last:border-b-0">
                    <td className="px-3 py-2">
                      <div className="font-medium">
                        {cert.user?.fullName || cert.user?.email || 'User'}
                      </div>
                      <div className="text-[11px] text-[var(--muted-foreground)]">
                        {cert.user?.email}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="font-medium">{cert.course?.title ?? 'Course'}</div>
                    </td>
                    <td className="px-3 py-2">
                      <span className="font-mono text-xs break-all">{cert.certificateId}</span>
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-xs text-[var(--muted-foreground)]">
                        {formatDate(cert.issuedAt)}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      {cert.certificateUrl ? (
                        <a
                          href={cert.certificateUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[var(--primary-700)] hover:text-[var(--primary-800)] underline text-xs"
                        >
                          View / Download
                        </a>
                      ) : (
                        <span className="text-[11px] text-[var(--muted-foreground)]">
                          No file
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        onClick={() => handleDelete(cert.id)}
                        className="text-xs text-red-600 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

