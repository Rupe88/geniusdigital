'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import * as adminApi from '@/lib/api/admin';
import * as courseApi from '@/lib/api/courses';
import * as enrollmentApi from '@/lib/api/enrollments';
import * as paymentAnalyticsApi from '@/lib/api/paymentAnalytics';
import * as referralApi from '@/lib/api/referrals';
import { getAllEventRegistrations } from '@/lib/api/events';
import {
  HiUsers,
  HiBookOpen,
  HiAcademicCap,
  HiCurrencyDollar,
  HiPlus,
  HiUserGroup,
  HiChartBar,
  HiShare,
  HiArrowTrendingUp,
  HiDocumentText,
  HiCheckCircle,
  HiCalendar
} from 'react-icons/hi2';
import { ROUTES } from '@/lib/utils/constants';
import { getApiBaseUrl } from '@/lib/api/axios';
import { getStorageImageSrc } from '@/lib/utils/storage';

interface DashboardStats {
  totalUsers: number;
  totalCourses: number;
  totalEnrollments: number;
  totalRevenue: number;
  referralClicks: number;
  referralConversions: number;
  publishedCourses: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalCourses: 0,
    totalEnrollments: 0,
    totalRevenue: 0,
    referralClicks: 0,
    referralConversions: 0,
    publishedCourses: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentCourses, setRecentCourses] = useState<any[]>([]);
  const [eventRegistrationsTotal, setEventRegistrationsTotal] = useState(0);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch all stats in parallel
      const [dashboardStats, referralStats, coursesData] = await Promise.all([
        adminApi.getDashboardStats().catch(() => null),
        referralApi.getReferralAnalytics().catch(() => null),
        courseApi.getAllCourses({ limit: 5 }).catch(() => ({ data: [], pagination: { total: 0 } })),
      ]);

      // Get published count
      const [publishedData] = await Promise.all([
        courseApi.getAllCourses({ status: 'PUBLISHED', limit: 1 }).catch(() => ({ pagination: { total: 0 } })),
      ]);

      if (dashboardStats) {
        setStats({
          totalUsers: dashboardStats.users?.total || 0,
          totalCourses: dashboardStats.courses?.total || 0,
          totalEnrollments: dashboardStats.enrollments?.total || 0,
          totalRevenue: dashboardStats.revenue?.today || 0,
          referralClicks: referralStats?.totalClicks || 0,
          referralConversions: referralStats?.totalConversions || 0,
          publishedCourses: publishedData.pagination?.total || 0,
        });
      } else {
        // Fallback to old method
        const [users, courses, enrollments, analytics] = await Promise.all([
          adminApi.getAllUsers({ limit: 1 }).catch(() => ({ pagination: { total: 0 } })),
          courseApi.getAllCourses({ limit: 1 }).catch(() => ({ pagination: { total: 0 } })),
          enrollmentApi.getAllEnrollments({ limit: 1 }).catch(() => ({ pagination: { total: 0 } })),
          paymentAnalyticsApi.getPaymentAnalytics().catch(() => ({ totalRevenue: 0 })),
        ]);

        setStats({
          totalUsers: users.pagination?.total || 0,
          totalCourses: courses.pagination?.total || 0,
          totalEnrollments: enrollments.pagination?.total || 0,
          totalRevenue: analytics.totalRevenue || 0,
          referralClicks: referralStats?.totalClicks || 0,
          referralConversions: referralStats?.totalConversions || 0,
          publishedCourses: publishedData.pagination?.total || 0,
        });
      }

      // Set recent courses
      if (coursesData.data) {
        setRecentCourses(coursesData.data.slice(0, 5));
      }

      // Fetch event registrations total count
      const bookingsRes = await getAllEventRegistrations({ page: 1, limit: 1 }).catch(() => ({ pagination: { total: 0 } }));
      setEventRegistrationsTotal(bookingsRes.pagination?.total ?? 0);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: HiUsers,
      color: 'blue',
      bgColor: 'bg-[var(--info-light)]',
      textColor: 'text-[var(--info)]',
      link: `${ROUTES.ADMIN}/users`,
    },
    {
      title: 'Total Courses',
      value: stats.totalCourses,
      icon: HiBookOpen,
      color: 'green',
      bgColor: 'bg-[var(--success-light)]',
      textColor: 'text-[var(--success)]',
      link: `${ROUTES.ADMIN}/courses`,
    },
    {
      title: 'Total Enrollments',
      value: stats.totalEnrollments,
      icon: HiAcademicCap,
      color: 'yellow',
      bgColor: 'bg-[var(--warning-light)]',
      textColor: 'text-[var(--warning)]',
      link: `${ROUTES.ADMIN}/enrollments`,
    },
    {
      title: 'Total Revenue',
      value: `Rs. ${stats.totalRevenue.toLocaleString()}`,
      icon: HiCurrencyDollar,
      color: 'purple',
      bgColor: 'bg-[var(--accent-violet-light)]',
      textColor: 'text-[var(--accent-violet)]',
      link: `${ROUTES.ADMIN}/finance`,
    },
  ];

  const quickActions = [
    {
      title: 'Create Course',
      description: 'Add a new course to your platform',
      icon: HiPlus,
      href: `${ROUTES.ADMIN}/courses/new`,
      color: 'bg-gradient-to-r from-green-500 to-green-600',
    },
    {
      title: 'Manage Users',
      description: 'View and manage user accounts',
      icon: HiUserGroup,
      href: `${ROUTES.ADMIN}/users`,
      color: 'bg-gradient-to-r from-blue-500 to-blue-600',
    },
    {
      title: 'Event Registrations',
      description: 'View upcoming event registered users',
      icon: HiCalendar,
      href: `${ROUTES.ADMIN}/event-registrations`,
      color: 'bg-gradient-to-r from-teal-500 to-cyan-600',
    },
    {
      title: 'View Referrals',
      description: 'Track social sharing analytics',
      icon: HiShare,
      href: `${ROUTES.ADMIN}/referrals`,
      color: 'bg-gradient-to-r from-purple-500 to-purple-600',
    },
    {
      title: 'Finance Report',
      description: 'View revenue and payments',
      icon: HiChartBar,
      href: `${ROUTES.ADMIN}/finance`,
      color: 'bg-gradient-to-r from-yellow-500 to-orange-500',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[var(--foreground)]">Admin Dashboard</h1>
          <p className="text-[var(--muted-foreground)] mt-2">
            Welcome back! Here's an overview of your platform.
          </p>
        </div>
        <Link href={`${ROUTES.ADMIN}/courses/new`}>
          <Button variant="primary">
            <HiPlus className="h-5 w-5 mr-2" />
            Create Course
          </Button>
        </Link>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <Link key={stat.title} href={stat.link}>
            <Card padding="lg" className="hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center">
                <div className={`p-3 ${stat.bgColor} rounded-none mr-4`}>
                  <stat.icon className={`h-6 w-6 ${stat.textColor}`} />
                </div>
                <div>
                  <p className="text-sm text-[var(--muted-foreground)]">{stat.title}</p>
                  <p className="text-2xl font-bold text-[var(--foreground)]">
                    {loading ? (
                      <span className="animate-pulse">...</span>
                    ) : typeof stat.value === 'number' ? (
                      stat.value.toLocaleString()
                    ) : (
                      stat.value
                    )}
                  </p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Secondary Stats Row – same size and layout as main stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link href={`${ROUTES.ADMIN}/referrals`}>
          <Card padding="lg" className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <div className="flex items-center">
              <div className="p-3 bg-indigo-100 rounded-none mr-4">
                <HiArrowTrendingUp className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--muted-foreground)]">Referral Clicks</p>
                <p className="text-2xl font-bold text-[var(--foreground)]">
                  {loading ? <span className="animate-pulse">...</span> : stats.referralClicks.toLocaleString()}
                </p>
              </div>
            </div>
          </Card>
        </Link>

        <Link href={`${ROUTES.ADMIN}/referrals`}>
          <Card padding="lg" className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-none mr-4">
                <HiCheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--muted-foreground)]">Referral Conversions</p>
                <p className="text-2xl font-bold text-[var(--foreground)]">
                  {loading ? <span className="animate-pulse">...</span> : stats.referralConversions.toLocaleString()}
                </p>
              </div>
            </div>
          </Card>
        </Link>

        <Link href={`${ROUTES.ADMIN}/courses`}>
          <Card padding="lg" className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-none mr-4">
                <HiDocumentText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--muted-foreground)]">Published Courses</p>
                <p className="text-2xl font-bold text-[var(--foreground)]">
                  {loading ? <span className="animate-pulse">...</span> : stats.publishedCourses.toLocaleString()}
                </p>
              </div>
            </div>
          </Card>
        </Link>

        <Link href={`${ROUTES.ADMIN}/event-registrations`}>
          <Card padding="lg" className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <div className="flex items-center">
              <div className="p-3 bg-teal-100 rounded-none mr-4">
                <HiCalendar className="h-6 w-6 text-teal-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--muted-foreground)]">Event Registrations</p>
                <p className="text-2xl font-bold text-[var(--foreground)]">
                  {loading ? <span className="animate-pulse">...</span> : eventRegistrationsTotal.toLocaleString()}
                </p>
              </div>
            </div>
          </Card>
        </Link>
      </div>

      {/* Quick Actions and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <Card padding="lg">
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">Quick Actions</h2>
            <div className="space-y-3">
              {quickActions.map((action) => (
                <Link key={action.title} href={action.href}>
                  <div className="flex items-center p-3 rounded-none hover:bg-[var(--muted)] transition-colors cursor-pointer">
                    <div className={`p-2 ${action.color} rounded-none mr-3`}>
                      <action.icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-[var(--foreground)]">{action.title}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">{action.description}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        </div>

        {/* Recent Courses */}
        <div className="lg:col-span-2">
          <Card padding="lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[var(--foreground)]">Recent Courses</h2>
              <Link href={`${ROUTES.ADMIN}/courses`}>
                <Button variant="ghost" size="sm">View All →</Button>
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse flex items-center gap-3 p-3 bg-[var(--muted)] rounded-none">
                    <div className="w-12 h-12 bg-gray-200 rounded-none" />
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded-none w-2/3 mb-2" />
                      <div className="h-3 bg-gray-200 rounded-none w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentCourses.length > 0 ? (
              <div className="space-y-3">
                {recentCourses.map((course) => (
                  <Link key={course.id} href={`${ROUTES.ADMIN}/courses/${course.id}`}>
                    <div className="flex items-center gap-3 p-3 rounded-none hover:bg-[var(--muted)] transition-colors cursor-pointer">
                      <div className="w-12 h-12 bg-gray-100 rounded-none overflow-hidden flex-shrink-0">
                        {course.thumbnail ? (
                          <img
                            src={getStorageImageSrc(course.thumbnail, getApiBaseUrl()) || course.thumbnail}
                            alt={course.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <HiBookOpen className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-[var(--foreground)] truncate">{course.title}</p>
                        <p className="text-xs text-[var(--muted-foreground)]">
                          {course.instructor?.name || 'No instructor'} • {course.status}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-none ${course.status === 'PUBLISHED'
                        ? 'bg-green-100 text-green-700'
                        : course.status === 'DRAFT'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-700'
                        }`}>
                        {course.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-[var(--muted-foreground)]">
                <HiBookOpen className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>No courses yet. Create your first course!</p>
                <Link href={`${ROUTES.ADMIN}/courses/new`}>
                  <Button variant="primary" className="mt-4">
                    <HiPlus className="h-4 w-4 mr-2" />
                    Create Course
                  </Button>
                </Link>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
