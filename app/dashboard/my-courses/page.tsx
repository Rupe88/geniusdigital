'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { StorageImage } from '@/components/ui/StorageImage';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import * as enrollmentApi from '@/lib/api/enrollments';
import { Enrollment } from '@/lib/types/course';
import { formatDate } from '@/lib/utils/helpers';

export default function MyCoursesPage() {
  const router = useRouter();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [accessInfo, setAccessInfo] = useState<Record<string, any | null>>({});

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const fetchEnrollments = async () => {
    try {
      const data = await enrollmentApi.getUserEnrollments();
      setEnrollments(data.data);
      
      // Check access expiry for each enrollment
      const accessPromises = data.data.map(async (enrollment) => {
        try {
          const accessData = await enrollmentApi.checkAccessExpiry(enrollment.courseId);
          return { [enrollment.courseId]: accessData };
        } catch (error) {
          console.error(`Error checking access for course ${enrollment.courseId}:`, error);
          return { [enrollment.courseId]: null };
        }
      });
      
      const accessResults = await Promise.all(accessPromises);
      const accessMap = Object.assign({}, ...accessResults);
      setAccessInfo(accessMap);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-[var(--foreground)] mb-8">My Courses</h1>

      {loading ? (
        <div>Loading...</div>
      ) : enrollments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrollments.map((enrollment) => (
            <div
              key={enrollment.id}
              className="bg-white border border-gray-200 shadow-[0_4px_10px_rgba(0,0,0,0.18)] hover:shadow-[0_14px_35px_rgba(0,0,0,0.10)] overflow-hidden hover:-translate-y-1 transition-all duration-200 rounded-lg cursor-pointer"
              onClick={() => router.push(`/dashboard/courses/${enrollment.courseId}/learn`)}
            >
              {/* Thumbnail - match Courses card sizing */}
              <div className="relative w-full h-52 p-2">
                {enrollment.course?.thumbnail ? (
                  <StorageImage
                    src={enrollment.course.thumbnail}
                    alt={enrollment.course.title}
                    fill
                    className="object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[var(--primary-100)] to-[var(--primary-200)] rounded-lg flex items-center justify-center">
                    <span className="text-[var(--primary-700)] font-semibold text-lg uppercase">
                      {enrollment.course?.title?.charAt(0)}
                    </span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="px-5 pt-0 pb-4">
                <h3 className="text-base font-[550] md:text-lg leading-6 antialiased tracking-[0.05em] text-gray-900 mb-2 line-clamp-2">
                  {enrollment.course?.title}
                </h3>
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-[var(--muted-foreground)]">Progress</span>
                    <span className="font-medium">{enrollment.progress}%</span>
                  </div>
                  <div className="w-full bg-[var(--muted)] rounded-none h-2">
                    <div
                      className="bg-[var(--primary-700)] h-2 rounded-none"
                      style={{ width: `${enrollment.progress}%` }}
                    />
                  </div>
                </div>
                
                {/* Access Expiry Information */}
                {accessInfo[enrollment.courseId] && (
                  <div className="mb-4">
                    {accessInfo[enrollment.courseId].accessStatus === 'FULL_ACCESS' ? (
                      <div className="text-sm text-green-600 bg-green-50 px-2 py-1 rounded">
                        Full Access
                      </div>
                    ) : (
                      <div className={`text-sm px-2 py-1 rounded ${
                        accessInfo[enrollment.courseId].warningLevel === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                        accessInfo[enrollment.courseId].warningLevel === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                        accessInfo[enrollment.courseId].warningLevel === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        <div className="flex justify-between items-center">
                          <span>
                            {accessInfo[enrollment.courseId].accessStatus === 'EXPIRED' ? 'Access Expired' :
                             accessInfo[enrollment.courseId].accessStatus === 'EXPIRING_SOON' ? 'Expires Soon' :
                             'Partial Access'}
                          </span>
                          {accessInfo[enrollment.courseId].daysRemaining !== undefined && (
                            <span className="font-medium">
                              {accessInfo[enrollment.courseId].daysRemaining < 0 
                                ? `${Math.abs(accessInfo[enrollment.courseId].daysRemaining)} days ago`
                                : `${accessInfo[enrollment.courseId].daysRemaining} days left`
                              }
                            </span>
                          )}
                        </div>
                        {accessInfo[enrollment.courseId].accessExpiresAt && (
                          <div className="text-xs mt-1 opacity-75">
                            Expires: {formatDate(accessInfo[enrollment.courseId].accessExpiresAt)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                <div className="flex items-center justify-between mt-1">
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        enrollment.accessType === 'PARTIAL' 
                          ? 'bg-blue-100 text-blue-800' 
                          : enrollment.accessType === 'FULL'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {enrollment.accessType || 'FULL'}
                      </div>
                  <Link
                    href={`/dashboard/courses/${enrollment.courseId}/learn`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button variant="primary" size="sm">
                      {enrollment.status === 'COMPLETED' ? 'Review' : 'Continue'}
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card padding="lg" className="text-center">
          <p className="text-[var(--muted-foreground)] mb-4">You haven't enrolled in any courses yet.</p>
          <Link href="/courses">
            <Button variant="primary">Browse Courses</Button>
          </Link>
        </Card>
      )}
    </div>
  );
}

