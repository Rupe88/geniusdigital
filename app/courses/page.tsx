'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { CourseCard } from '@/components/CourseCard';
import * as courseApi from '@/lib/api/courses';
import * as categoryApi from '@/lib/api/categories';
import { Course, Category } from '@/lib/types/course';
import { PaginatedResponse } from '@/lib/types/api';
import { formatCurrency } from '@/lib/utils/helpers';
import { HiSearch } from 'react-icons/hi';

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0,
  });

  // Load course categories once
  useEffect(() => {
    let cancelled = false;

    const loadCategories = async () => {
      try {
        const data = await categoryApi.getAllCategories({ type: 'COURSE' });
        if (!cancelled) {
          setCategories(data || []);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Error fetching course categories:', error);
          setCategories([]);
        }
      }
    };

    loadCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  // Load courses when filters or page change
  useEffect(() => {
    fetchCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, search, selectedCategory]);

  const fetchCourses = async () => {
    try {
      setLoading(true);

      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (search) {
        // If search looks like /regex/, treat inner content as regex pattern
        if (search.startsWith('/') && search.endsWith('/') && search.length > 2) {
          params.searchRegex = search.slice(1, -1);
        } else {
          params.search = search;
        }
      }

      if (selectedCategory) {
        params.category = selectedCategory;
      }

      const data: PaginatedResponse<Course> = await courseApi.filterCourses(params);
      setCourses(data.data || []);
      setPagination({
        page: data.pagination?.page || pagination.page,
        limit: data.pagination?.limit || pagination.limit,
        total: data.pagination?.total || 0,
        pages: data.pagination?.pages || 0,
      });
    } catch (error) {
      console.error('Error fetching courses:', error);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSearch(searchInput.trim());
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleCategoryClick = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  return (
    <div className="min-h-screen bg-[var(--muted)] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 space-y-4">
          <h1 className="text-4xl font-bold text-[var(--foreground)]">All Courses</h1>

          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="max-w-lg">
            <div className="inline-flex p-1 h-[52px] items-stretch border border-[#ae8c94] rounded-[10px] bg-[var(--muted)] overflow-hidden">
              <div className="flex items-center px-2 text-[#ae8c94]">
                <HiSearch className="h-6 w-6" />
              </div>
              <div className="w-[320px]">
                <input
                  type="text"
                  placeholder="search your course...."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full h-full px-4 py-2 bg-[var(--muted)] text-[var(--foreground)] border-none outline-none focus:outline-none focus:ring-0"
                />
              </div>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                className="rounded-none px-5  focus:ring-0 outline-none focus:ring-offset-0"
                style={{ borderRadius: '8px' }}
              >
                Search
              </Button>
            </div>
          </form>

          {/* Category buttons */}
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={`px-4 py-2 text-base font-medium inline-flex items-center justify-center rounded-full border transition-colors focus:outline-none focus:ring-0 focus:ring-offset-0 ${
                  selectedCategory === null
                    ? 'border-[var(--primary-700)] text-[var(--primary-700)] bg-transparent'
                    : 'border-transparent text-[var(--foreground)] bg-transparent'
                }`}
                onClick={() => handleCategoryClick(null)}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  className={`px-4 py-2 text-base font-medium inline-flex items-center justify-center rounded-full border transition-colors focus:outline-none focus:ring-0 focus:ring-offset-0 ${
                    selectedCategory === cat.id
                      ? 'border-[var(--primary-700)] text-[var(--primary-700)] bg-transparent'
                      : 'border-transparent text-[var(--foreground)] bg-transparent'
                  }`}
                  onClick={() => handleCategoryClick(cat.id)}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12">Loading courses...</div>
        ) : courses.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {courses.map((course) => (
                <CourseCard
                  key={course.id}
                  id={course.id}
                  title={course.title}
                  thumbnail={course.thumbnail || undefined}
                  price={course.isFree ? 'Free' : formatCurrency(course.price)}
                  oldPrice={
                    course.originalPrice ? formatCurrency(course.originalPrice) : undefined
                  }
                  slug={course.slug}
                />
              ))}
            </div>

            {pagination.pages > 1 && (
              <div className="flex justify-center gap-2">
                <Button
                  variant="outline"
                  onClick={() =>
                    setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
                  }
                  disabled={pagination.page === 1}
                >
                  Previous
                </Button>
                <span className="flex items-center px-4">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <Button
                  variant="outline"
                  onClick={() =>
                    setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
                  }
                  disabled={pagination.page >= pagination.pages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 text-[var(--muted-foreground)]">
            No courses found
          </div>
        )}
      </div>
    </div>
  );
}

