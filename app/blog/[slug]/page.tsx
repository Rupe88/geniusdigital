'use client';

import React, { use, useEffect, useState } from 'react';
import { StorageImage } from '@/components/ui/StorageImage';
import { useRouter } from 'next/navigation';
import { HiArrowLeft, HiCalendar, HiUser, HiEye } from 'react-icons/hi';
import { blogsApi, Blog } from '@/lib/api/blog';

export default function BlogDetailPage({
    params: paramsPromise,
}: {
    params: Promise<{ slug?: string }>;
}) {
    const params = use(paramsPromise);
    const router = useRouter();
    const slug = params?.slug as string;
    const [blog, setBlog] = useState<Blog | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (slug) {
            const fetchBlog = async () => {
                try {
                    // Assuming getById also accepts slug, or we need a getBySlug method.
                    // The backend getBlogById (controller) handles ID OR Slug.
                    const response = await blogsApi.getById(slug);
                    if (response && response.data) {
                        setBlog(response.data);
                    } else {
                        // Handle 404
                        setBlog(null);
                    }
                } catch (error) {
                    console.error('Failed to fetch blog', error);
                } finally {
                    setLoading(false);
                }
            };
            fetchBlog();
        }
    }, [slug]);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading article...</div>;
    }

    if (!blog) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
                <h1 className="text-2xl font-bold text-gray-900">Article not found</h1>
                <button onClick={() => router.back()} className="text-indigo-600 hover:text-indigo-800">
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <article className="min-h-screen bg-gray-50 py-10">
            {/* Outer container aligned with navbar width */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <button
                    onClick={() => router.push('/blog')}
                    className="mb-6 inline-flex items-center text-sm font-medium text-[var(--primary-700)] hover:text-[var(--primary-900)]"
                >
                    <HiArrowLeft className="mr-2" />
                    Back to Blog
                </button>

                {/* Inner card column centered within main container */}
                <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
                    {/* Featured image */}
                    <div className="relative w-full h-64 sm:h-80 md:h-96">
                        {blog.featuredImage ? (
                            <StorageImage
                                src={blog.featuredImage}
                                alt={blog.title}
                                fill
                                className="object-cover"
                                priority
                            />
                        ) : (
                            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                <span className="text-5xl">📚</span>
                            </div>
                        )}
                    </div>

                    {/* Meta + content */}
                    <div className="px-5 sm:px-8 py-8">
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-4">
                            <span className="flex items-center">
                                <HiCalendar className="mr-1.5" />
                                {new Date(blog.createdAt).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                })}
                            </span>
                            {blog.author && (
                                <span className="flex items-center">
                                    <HiUser className="mr-1.5" />
                                    {blog.author.fullName}
                                </span>
                            )}
                            <span className="flex items-center">
                                <HiEye className="mr-1.5" />
                                {blog.views} views
                            </span>
                        </div>

                        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6 leading-tight">
                            {blog.title}
                        </h1>

                        <div
                            className="blog-content text-gray-800 leading-relaxed text-base sm:text-lg"
                            dangerouslySetInnerHTML={{ __html: blog.content }}
                        />

                        {blog.tags && (
                            <div className="mt-10 pt-6 border-t border-gray-100">
                                <h4 className="text-sm font-semibold text-gray-500 mb-3">Tags</h4>
                                <div className="flex flex-wrap gap-2">
                                    {blog.tags.split(',').map((tag) => (
                                        <span
                                            key={tag}
                                            className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs sm:text-sm"
                                        >
                                            #{tag.trim()}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style jsx global>{`
        .blog-content h1 { font-size: 2rem; font-weight: 700; margin-top: 2rem; margin-bottom: 1rem; color: #111827; }
        .blog-content h2 { font-size: 1.75rem; font-weight: 600; margin-top: 2rem; margin-bottom: 1rem; color: #1f2937; }
        .blog-content h3 { font-size: 1.375rem; font-weight: 600; margin-top: 1.5rem; margin-bottom: 0.75rem; color: #1f2937; }
        .blog-content p { margin-bottom: 1.5rem; }
        .blog-content ul { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 1.5rem; }
        .blog-content ol { list-style-type: decimal; padding-left: 1.5rem; margin-bottom: 1.5rem; }
        .blog-content blockquote { border-left: 4px solid #4f46e5; padding-left: 1rem; font-style: italic; color: #4b5563; margin-bottom: 1.5rem; background: #f9fafb; padding: 1rem; border-radius: 0 0.5rem 0.5rem 0; }
        .blog-content img { border-radius: 0.75rem; margin-top: 2rem; margin-bottom: 2rem; width: 100%; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
        .blog-content a { color: #4f46e5; text-decoration: underline; }
      `}</style>
        </article>
    );
}
