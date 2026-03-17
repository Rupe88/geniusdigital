'use client';

import React, { use, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { pdf } from '@react-pdf/renderer';
import { useAuth } from '@/lib/context/AuthContext';
import * as enrollmentApi from '@/lib/api/enrollments';
import type { Enrollment } from '@/lib/types/course';
import { CourseCertificatePdf } from '@/components/certificates/CourseCertificatePdf';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { formatDate } from '@/lib/utils/helpers';
import { getApiBaseUrl } from '@/lib/api/axios';
import { useCertificateDownloadStore } from '@/lib/store/useCertificateDownloadStore';

export default function CertificateDetailPage({
  params: paramsPromise,
}: {
  params: Promise<{ courseId?: string }>;
}) {
  const params = use(paramsPromise);
  const router = useRouter();
  const { user } = useAuth();
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    generatingCourseId,
    generatingProgress,
    startGenerating,
    finishGenerating,
    clearGenerating,
    getBlobUrl,
    setBlobUrl,
  } = useCertificateDownloadStore();

  const toDataUrl = async (url: string) => {
    // Use backend proxy to avoid CORS issues when reading bytes for base64 conversion
    const proxyUrl = `${getApiBaseUrl()}/certificate/template-proxy?url=${encodeURIComponent(url)}`;
    const res = await fetch(proxyUrl, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Failed to load template image (${res.status})`);
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Failed to read template image'));
      reader.readAsDataURL(blob);
    });
  };

  const courseId = useMemo(() => {
    const id = params.courseId;
    return typeof id === 'string' ? id : Array.isArray(id) ? id[0] : '';
  }, [params.courseId]);

  useEffect(() => {
    if (!courseId) {
      setLoading(false);
      setError('Invalid course.');
      return;
    }
    let cancelled = false;
    const run = async () => {
      try {
        setLoading(true);
        const res = await enrollmentApi.getUserEnrollments({ page: 1, limit: 200 });
        if (cancelled) return;
        const match =
          res.data?.find((e) => e.courseId === courseId || e.course?.id === courseId) ?? null;
        if (!match) {
          setError('Certificate not found for this course. Make sure you are enrolled in it.');
          setEnrollment(null);
        } else if (!match.course?.certificateTemplateUrl) {
          setError('This course does not have a certificate template attached yet.');
          setEnrollment(null);
        } else {
          setError(null);
          setEnrollment(match);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Failed to load certificate details.'
          );
          setEnrollment(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  const handleDownload = async () => {
    if (!enrollment || !user || !enrollment.course?.certificateTemplateUrl) return;
    const activeCourseId = enrollment.course?.id || enrollment.courseId;
    try {
      const name = user.fullName || 'Student';
      const dateStr = enrollment.completedAt
        ? formatDate(enrollment.completedAt)
        : enrollment.enrolledAt
        ? formatDate(enrollment.enrolledAt)
        : '';

      const cached = getBlobUrl(activeCourseId);
      if (cached) {
        const a = document.createElement('a');
        a.href = cached;
        a.download = `${name.replace(/\s+/g, '_')}_certificate.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return;
      }

      startGenerating(activeCourseId);

      const rawTemplateUrl = enrollment.course.certificateTemplateUrl;

      // If the admin uploaded a PDF template, we can't use it as an Image background here.
      // (react-pdf Image supports common image formats; PDFs will fail and often look blank/black)
      const looksLikePdf = /\.pdf(\?|#|$)/i.test(rawTemplateUrl);
      if (looksLikePdf) {
        throw new Error(
          'Certificate template is a PDF. Please ask admin to upload a PNG/JPG certificate template.'
        );
      }

      // Always embed as a data URL via backend proxy, so PDF background never blanks/blackens.
      // Proxy also converts WEBP -> PNG for react-pdf compatibility.
      const templateUrlToUse = await toDataUrl(rawTemplateUrl);

      const doc = (
        <CourseCertificatePdf
          templateUrl={templateUrlToUse}
          name={name}
          dateStr={dateStr}
        />
      );

      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const fileName = `${name.replace(/\s+/g, '_')}_certificate.pdf`;

      finishGenerating(activeCourseId, url, blob, user.id);

      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to generate certificate PDF:', err);
      clearGenerating();
      alert(
        err instanceof Error
          ? `Failed to generate PDF: ${err.message}`
          : 'Failed to generate PDF. Please try again.'
      );
    }
  };

  if (!courseId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-4">
        <p className="text-gray-700 font-medium">Invalid course link.</p>
        <Button variant="primary" size="md" onClick={() => router.push('/dashboard/certificates')}>
          Back to My Certificates
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-12 h-12 border-4 border-[var(--primary-600)] border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 font-medium">Loading certificate…</p>
      </div>
    );
  }

  if (error || !enrollment || !enrollment.course?.certificateTemplateUrl) {
    return (
      <Card padding="lg" className="max-w-xl mx-auto mt-10">
        <h1 className="text-xl font-semibold mb-2">Certificate</h1>
        <p className="text-sm text-[var(--muted-foreground)] mb-4">
          {error || 'Certificate not available for this course.'}
        </p>
        <Button variant="primary" onClick={() => router.push('/dashboard/certificates')}>
          Back to My Certificates
        </Button>
      </Card>
    );
  }

  const templateUrl = enrollment.course.certificateTemplateUrl;
  const displayName = user?.fullName || 'Student';
  const dateStr = enrollment.completedAt
    ? formatDate(enrollment.completedAt)
    : enrollment.enrolledAt
    ? formatDate(enrollment.enrolledAt)
    : '';

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-1">Certificate</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Personalized certificate preview. Your name and date will be embedded in the downloaded PDF.
        </p>
      </div>

      {/* Preview */}
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-full max-w-3xl border border-[var(--border)] bg-[var(--muted)]">
          <img
            src={templateUrl}
            alt="Certificate template"
            className="w-full h-auto object-contain"
          />
          {/* Overlay text for preview only (approximate positions) */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute left-1/2 -translate-x-1/2 top-[38%] text-center">
              <p className="text-base sm:text-2xl md:text-3xl font-bold text-gray-800 tracking-wide">
                {displayName}
              </p>
            </div>
            <div className="absolute left-1/2 -translate-x-1/2 top-[58%] text-center">
              <p className="text-[9px] sm:text-xs text-gray-600">{dateStr}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <Button
            variant="primary"
            size="lg"
            onClick={handleDownload}
            disabled={generatingCourseId === (enrollment.course?.id || enrollment.courseId)}
            className="px-6"
          >
            {generatingCourseId === (enrollment.course?.id || enrollment.courseId)
              ? `Generating… ${generatingProgress}%`
              : 'Download PDF'}
          </Button>
          <Button
            variant="outline"
            size="md"
            onClick={() => router.push('/dashboard/certificates')}
          >
            Back to My Certificates
          </Button>
        </div>
      </div>
    </div>
  );
}

