'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/utils/helpers';
import * as enrollmentApi from '@/lib/api/enrollments';
import type { Enrollment } from '@/lib/types/course';

export default function CertificatesPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await enrollmentApi.getUserEnrollments({ page: 1, limit: 100 });
        if (!cancelled) setEnrollments(res.data || []);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load certificates');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <div>Loading certificates...</div>;
  }

  if (error) {
    return (
      <Card padding="lg">
        <p className="text-[var(--muted-foreground)] mb-4">Failed to load certificates: {error}</p>
      </Card>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-[var(--foreground)] mb-8">My Certificates</h1>

      {enrollments.filter((e) => e.course?.certificateTemplateUrl).length === 0 ? (
        <Card padding="lg" className="text-center">
          <p className="text-[var(--muted-foreground)] mb-4">
            No certificates are available yet. Ask the admin to attach a certificate template to your course.
          </p>
          <Link href="/courses">
            <Button variant="primary">Browse Courses</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {enrollments
            .filter((e) => e.course?.certificateTemplateUrl)
            .map((enrollment) => (
            <Card key={enrollment.id} padding="lg" className="flex flex-col">
              <div className="flex-1 flex flex-col">
                <h2 className="text-base font-semibold text-[var(--foreground)] mb-1 line-clamp-2">
                  {enrollment.course?.title ?? 'Course'}
                </h2>
                <p className="text-xs text-[var(--muted-foreground)] mb-2">
                  Status: <span className="font-mono break-all">{enrollment.status}</span>
                </p>
                <p className="text-xs text-[var(--muted-foreground)] mb-4">
                  {(() => {
                    const completed = enrollment.completedAt ? formatDate(enrollment.completedAt) : '';
                    if (completed) return `Completed on ${completed}`;
                    const enrolled = enrollment.enrolledAt ? formatDate(enrollment.enrolledAt) : '';
                    return enrolled ? `Enrolled on ${enrolled}` : 'Enrolled';
                  })()}
                </p>
                <div className="mt-auto flex justify-between items-center gap-2">
                  <span className="text-[11px] uppercase tracking-wide text-[var(--muted-foreground)]">
                    Download your certificate
                  </span>
                  {enrollment.course?.certificateTemplateUrl ? (
                    <Link href={`/dashboard/certificates/${enrollment.course.id}`}>
                      <Button variant="primary" size="sm">
                        View / Download
                      </Button>
                    </Link>
                  ) : (
                    <span className="text-[11px] text-[var(--muted-foreground)]">
                      Coming soon
                    </span>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

