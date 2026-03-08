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

  // Define specific category order
  const categoryOrder = ['Vastu', 'Numerology', 'Money and Wealth', 'NLP'];
  
  // Sort categories according to the defined order, then alphabetically for others
  const sortedCategories = [...categories].sort((a, b) => {
    const aIndex = categoryOrder.indexOf(a.name);
    const bIndex = categoryOrder.indexOf(b.name);
    
    // If both are in the defined order, sort by that order
    if (aIndex !== -1 && bIndex !== -1) {
      return aIndex - bIndex;
    }
    
    // If only one is in the defined order, prioritize it
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    
    // If neither is in the defined order, sort alphabetically
    return a.name.localeCompare(b.name);
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
    <div className="min-h-screen bg-[var(--muted)] py-6 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 space-y-4">
          {/* Search bar - wider on desktop for better proportions */}
          <form onSubmit={handleSearchSubmit} className="w-full max-w-lg md:max-w-xl lg:max-w-2xl">
            <div className="flex p-1 h-[48px] md:h-[52px] items-stretch border border-[#ae8c94] rounded-[10px] bg-[var(--muted)] overflow-hidden">
              <div className="flex items-center pl-3 pr-2 text-[#ae8c94] shrink-0">
                <HiSearch className="h-5 w-5 md:h-6 md:w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <input
                  type="text"
                  placeholder="Search your course..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full h-full px-3 md:px-4 py-2 bg-[var(--muted)] text-[var(--foreground)] text-sm md:text-base border-none outline-none focus:outline-none focus:ring-0 placeholder:text-gray-500"
                />
              </div>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                className="rounded-none px-4 md:px-6 shrink-0 focus:ring-0 outline-none focus:ring-offset-0 h-full"
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
              {sortedCategories.map((cat) => (
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
          <div className="space-y-6">
            {/* Category pills skeleton */}
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 5 }).map((_, idx) => (
                <div
                  key={idx}
                  className="h-9 w-20 rounded-full bg-[var(--muted)]/80 animate-pulse"
                />
              ))}
            </div>

            {/* Course cards skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={idx}
                  className="h-full rounded-xl bg-white border border-[var(--border)] shadow-sm overflow-hidden animate-pulse"
                >
                  <div className="h-40 bg-[var(--muted)]" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 w-3/4 bg-[var(--muted)] rounded-md" />
                    <div className="h-3 w-1/2 bg-[var(--muted)] rounded-md" />
                    <div className="h-3 w-full bg-[var(--muted)] rounded-md" />
                    <div className="flex items-center justify-between pt-2">
                      <div className="h-4 w-16 bg-[var(--muted)] rounded-md" />
                      <div className="h-8 w-20 bg-[var(--muted)] rounded-md" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
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

