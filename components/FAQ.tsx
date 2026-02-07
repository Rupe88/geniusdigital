'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { HiChevronUp, HiChevronDown } from 'react-icons/hi';
import { getAllFAQs, type FAQ as FAQType } from '@/lib/api/faq';
import { ROUTES } from '@/lib/utils/constants';
import { 
  ALL_FAQ_CATEGORIES, 
  FAQ_CATEGORIES,
  getFAQCategoryDisplayName 
} from '@/lib/utils/faqCategories';

export const FAQ: React.FC = () => {
  const [faqs, setFaqs] = useState<FAQType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>(FAQ_CATEGORIES.GENERAL);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [allExpanded, setAllExpanded] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchFAQs = async () => {
      try {
        setLoading(true);
        const data = await getAllFAQs();
        if (!cancelled) {
          // Filter by isActive/published if available, otherwise show all
          // Note: Backend uses 'isActive' but frontend interface shows 'published'
          // We'll filter client-side to handle both cases
          const activeFaqs = data.filter((faq) => {
            const faqAny = faq as any;
            // Check if isActive exists and is false
            if ('isActive' in faqAny && faqAny.isActive === false) {
              return false;
            }
            // Check if published exists and is false
            if ('published' in faqAny && faqAny.published === false) {
              return false;
            }
            // Show FAQ if neither field is explicitly false
            return true;
          });
          setFaqs(activeFaqs);
          
          // Expand all items by default
          if (activeFaqs.length > 0) {
            setExpandedItems(new Set(activeFaqs.map((faq) => faq.id)));
            setAllExpanded(true);
          }
        }
      } catch (error) {
        console.error('Error fetching FAQs:', error);
        if (!cancelled) {
          setFaqs([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchFAQs();

    return () => {
      cancelled = true;
    };
  }, []);

  // Filter FAQs by selected category
  const filteredFaqs = faqs.filter((faq) => {
    if (selectedCategory === 'ALL') return true;
    return faq.category === selectedCategory;
  });

  // Get unique categories from FAQs
  const availableCategories = React.useMemo(() => {
    const categories = new Set<string>();
    faqs.forEach((faq) => {
      if (faq.category) {
        categories.add(faq.category);
      }
    });
    return Array.from(categories).sort();
  }, [faqs]);

  // Toggle individual FAQ item
  const toggleItem = (id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Toggle all items
  const toggleAll = () => {
    if (allExpanded) {
      // Collapse all
      setExpandedItems(new Set());
      setAllExpanded(false);
    } else {
      // Expand all
      setExpandedItems(new Set(filteredFaqs.map((faq) => faq.id)));
      setAllExpanded(true);
    }
  };

  // Update allExpanded state when expandedItems changes
  useEffect(() => {
    if (filteredFaqs.length === 0) {
      setAllExpanded(false);
      return;
    }
    const allItemsExpanded = filteredFaqs.every((faq) => expandedItems.has(faq.id));
    setAllExpanded(allItemsExpanded);
  }, [expandedItems, filteredFaqs]);

  // Reset expanded items when category changes
  useEffect(() => {
    if (filteredFaqs.length > 0) {
      setExpandedItems(new Set(filteredFaqs.map((faq) => faq.id)));
      setAllExpanded(true);
    } else {
      setExpandedItems(new Set());
      setAllExpanded(false);
    }
  }, [selectedCategory]);

  if (loading) {
    return (
      <section className="pt-8 pb-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6">
            <h2 className="section-title text-gray-900 mb-3">Frequently Asked Questions</h2>

          </div>
          <div className="flex justify-center py-12">
            <div className="animate-pulse rounded-lg bg-gray-200 h-64 w-full max-w-4xl" />
          </div>
        </div>
      </section>
    );
  }

  // Use available categories or fallback to all categories
  const categoriesToShow = availableCategories.length > 0 ? availableCategories : ALL_FAQ_CATEGORIES;

  return (
    <section className="pt-8 pb-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title - Outside flex container, aligned left like other sections */}
        <div className="mb-6">
          <h2 className="section-title text-gray-900 mb-2">Frequently Asked Questions</h2>

        </div>

        {/* Flex container with sidebar and content - both start from same position */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Sidebar - Category Navigation */}
          <aside className="w-full lg:w-64 flex-shrink-0">
            <div className="bg-gray-100 rounded-lg p-4">
              <nav className="space-y-2">
                {categoriesToShow.map((category) => {
                  const displayName = getFAQCategoryDisplayName(category);
                  const isActive = selectedCategory === category;
                  const hasFaqs = faqs.some((faq) => faq.category === category);

                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setSelectedCategory(category)}
                      disabled={!hasFaqs}
                      className={`w-full text-left px-4 py-2.5 rounded-md transition-colors ${
                        isActive
                          ? 'bg-[var(--primary-700)] text-white font-medium'
                          : hasFaqs
                          ? 'text-gray-900 hover:bg-gray-200'
                          : 'text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {displayName}
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* Right Content Area */}
          <div className="flex-1">
            {/* Collapse All Button */}
            {filteredFaqs.length > 0 && (
              <div className="mb-6">
                <button
                  type="button"
                  onClick={toggleAll}
                  className="px-4 py-2 text-blue-600  transition-colors text-sm font-medium"
                >
                  {allExpanded ? 'Collapse all' : 'Expand all'}
                </button>
              </div>
            )}

            {/* FAQ Items */}
            {filteredFaqs.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600">No FAQs available in this category.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredFaqs.map((faq) => {
                  const isExpanded = expandedItems.has(faq.id);
                  return (
                    <div
                      key={faq.id}
                      className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm"
                    >
                      <button
                        type="button"
                        onClick={() => toggleItem(faq.id)}
                        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                        aria-expanded={isExpanded}
                      >
                        <span className="font-semibold text-gray-900 pr-4">{faq.question}</span>
                        {isExpanded ? (
                          <HiChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
                        ) : (
                          <HiChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                        )}
                      </button>
                      {isExpanded && (
                        <div className="px-6 pb-4 pt-2 border-t border-gray-100">
                          <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Contact Us Link */}
            <div className="mt-8 text-center">
              <p className="text-gray-600">
                Still stuck?{' '}
                <Link
                  href={ROUTES.CONTACT}
                  className="text-blue-600 hover:text-blue-700 underline font-medium"
                >
                  Contact Us.
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
