'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { certificatesApi, type Certificate } from '@/lib/api/certificates';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StorageImage } from '@/components/ui/StorageImage';
import { formatDate } from '@/lib/utils/helpers';

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await certificatesApi.getUserCertificates();
        if (!cancelled) setCertificates(data);
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

      {certificates.length === 0 ? (
        <Card padding="lg" className="text-center">
          <p className="text-[var(--muted-foreground)] mb-4">
            You don&apos;t have any certificates yet. Complete your courses to earn certificates.
          </p>
          <Link href="/courses">
            <Button variant="primary">Browse Courses</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {certificates.map((cert) => (
            <Card key={cert.id} padding="none" className="overflow-hidden flex flex-col">
              <div className="relative w-full h-40 bg-[var(--muted)] flex items-center justify-center">
                {cert.course?.thumbnail ? (
                  <StorageImage
                    src={cert.course.thumbnail}
                    alt={cert.course.title}
                    fill
                    className="object-contain"
                  />
                ) : (
                  <span className="text-sm font-semibold text-[var(--muted-foreground)]">
                    {cert.course?.title?.charAt(0) ?? 'C'}
                  </span>
                )}
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <h2 className="text-base font-semibold text-[var(--foreground)] mb-1 line-clamp-2">
                  {cert.course?.title ?? 'Course'}
                </h2>
                <p className="text-xs text-[var(--muted-foreground)] mb-2">
                  Certificate ID: <span className="font-mono break-all">{cert.certificateId}</span>
                </p>
                <p className="text-xs text-[var(--muted-foreground)] mb-4">
                  Issued on {formatDate(cert.issuedAt)}
                </p>
                <div className="mt-auto flex justify-between items-center gap-2">
                  <span className="text-[11px] uppercase tracking-wide text-[var(--muted-foreground)]">
                    Download your certificate
                  </span>
                  {cert.certificateUrl ? (
                    <a
                      href={cert.certificateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="primary" size="sm">
                        View / Download
                      </Button>
                    </a>
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

