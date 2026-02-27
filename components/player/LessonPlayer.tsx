'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Lesson } from '@/lib/types/course';
import { QuizPlayer } from './QuizPlayer';
import { HiDocumentText, HiVideoCamera, HiClipboardList, HiDownload, HiRefresh } from 'react-icons/hi';
import { Button } from '@/components/ui/Button';
import { getVideoEmbedUrl, getDocumentOpenUrl } from '@/lib/utils/helpers';
import { getVideoStreamUrl, isSecureStreamPath, isOurS3Url } from '@/lib/api/media';

interface LessonPlayerProps {
    lesson: Lesson;
    onComplete?: () => void;
}

export const LessonPlayer: React.FC<LessonPlayerProps> = ({ lesson, onComplete }) => {
    const [secureVideoSrc, setSecureVideoSrc] = useState<string | null>(null);
    const [secureVideoError, setSecureVideoError] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState(0);
    const [autoRetryUsed, setAutoRetryUsed] = useState(false);
    const fetchedForLessonId = useRef<string | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    const retryVideo = () => {
        setSecureVideoError(null);
        setSecureVideoSrc(null);
        fetchedForLessonId.current = null;
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        setRetryCount((c) => c + 1);
    };

    // Reset auto-retry flag when lesson changes
    useEffect(() => {
        setAutoRetryUsed(false);
    }, [lesson.id]);

    useEffect(() => {
        if (lesson.lessonType !== 'VIDEO' || !lesson.videoUrl) return;

        const isS3 = isOurS3Url(lesson.videoUrl);
        const isStream = isSecureStreamPath(lesson.videoUrl);
        if (!isS3 && !isStream) return;

        // If lesson changed (or retry), reset state and cancel previous request
        if (fetchedForLessonId.current !== null && fetchedForLessonId.current !== lesson.id) {
            setSecureVideoSrc(null);
            setSecureVideoError(null);
            fetchedForLessonId.current = null;
            // Cancel previous request if it exists
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
                abortControllerRef.current = null;
            }
        }
        
        if (fetchedForLessonId.current === lesson.id && (secureVideoSrc || secureVideoError)) return;
        if (abortControllerRef.current && fetchedForLessonId.current === lesson.id) return;
        
        // Mark as fetching to prevent duplicate requests
        fetchedForLessonId.current = lesson.id;
        
        // Create abort controller for this request
        const abortController = new AbortController();
        abortControllerRef.current = abortController;
        
        setSecureVideoError(null);

        getVideoStreamUrl({ lessonId: lesson.id })
            .then((url) => {
                if (abortController.signal.aborted) return;
                if (fetchedForLessonId.current !== lesson.id) return;
                setSecureVideoSrc(url);
                abortControllerRef.current = null;
            })
            .catch((err) => {
                if (abortController.signal.aborted) return;
                if (fetchedForLessonId.current !== lesson.id) return;
                setSecureVideoError(err instanceof Error ? err.message : 'Could not load video');
                // Reset on error so we can retry
                fetchedForLessonId.current = null;
                abortControllerRef.current = null;
            });
            
        return () => {
            if (fetchedForLessonId.current !== lesson.id) {
                abortController.abort();
                abortControllerRef.current = null;
            }
        };
    }, [lesson.id, lesson.lessonType, lesson.videoUrl, retryCount]);

    const renderContent = () => {
        switch (lesson.lessonType) {
            case 'VIDEO': {
                const embedUrl = lesson.videoUrl ? getVideoEmbedUrl(lesson.videoUrl) : null;
                const isSecureStream = isSecureStreamPath(lesson.videoUrl);
                const videoSrc = isSecureStream ? secureVideoSrc : lesson.videoUrl;

                return (
                    <div className="space-y-6">
                        <div className="aspect-video bg-black shadow-2xl">
                            {embedUrl ? (
                                <iframe
                                    src={embedUrl}
                                    className="w-full h-full"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    title="Video player"
                                />
                            ) : secureVideoError ? (
                                <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 gap-4 p-6">
                                    <HiVideoCamera className="w-16 h-16 opacity-20" />
                                    <p className="font-bold text-center">Video couldn’t load. The link may have expired or the source is temporarily unavailable.</p>
                                    <p className="text-sm text-center opacity-80">Refreshing the page or trying again often fixes this.</p>
                                    <Button type="button" variant="primary" onClick={retryVideo} className="inline-flex items-center gap-2">
                                        <HiRefresh className="w-5 h-5" />
                                        Try again
                                    </Button>
                                </div>
                            ) : videoSrc ? (
                                <video
                                    key={videoSrc}
                                    src={videoSrc}
                                    controls
                                    preload="metadata"
                                    playsInline
                                    className="w-full h-full"
                                    onEnded={onComplete}
                                    autoPlay
                                    onError={(e) => {
                                        const v = e.currentTarget;
                                        const mediaError = v?.error;
                                        const errorMsg = mediaError?.message || 'Video playback failed';
                                        const errorCode = mediaError?.code;

                                        if (isSecureStreamPath(lesson.videoUrl) && !autoRetryUsed) {
                                            setAutoRetryUsed(true);
                                            retryVideo();
                                            return;
                                        }

                                        setSecureVideoError(`${errorMsg}${errorCode ? ` (${errorCode})` : ''}`);
                                    }}
                                />
                            ) : isSecureStreamPath(lesson.videoUrl) ? (
                                <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 gap-4">
                                    <HiVideoCamera className="w-16 h-16 opacity-20 animate-pulse" />
                                    <p className="font-bold">Loading video...</p>
                                </div>
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 gap-4">
                                    <HiVideoCamera className="w-16 h-16 opacity-20" />
                                    <p className="font-bold">Video content not available</p>
                                </div>
                            )}
                        </div>
                        <div className="prose max-w-none text-gray-700 ql-editor px-0"
                            dangerouslySetInnerHTML={{ __html: lesson.content || lesson.description || '' }} />
                    </div>
                );
            }

            case 'TEXT':
                return (
                    <div className="bg-white p-8 md:p-12 shadow-sm border border-gray-100 min-h-[500px]">
                        <div className="prose max-w-none text-gray-800 leading-relaxed ql-editor px-0"
                            dangerouslySetInnerHTML={{ __html: lesson.content || lesson.description || '' }} />
                    </div>
                );

            case 'PDF': {
                const pdfUrl = lesson.attachmentUrl ?? '';
                const docDownloadUrl = pdfUrl ? getDocumentOpenUrl(pdfUrl) : '';
                const isDrive = pdfUrl && /drive\.google\.com\/file\/d\//.test(pdfUrl);

                return (
                    <div className="space-y-6">
                        <div className="bg-white p-8 md:p-12 shadow-sm border border-gray-100">
                            <div className="flex flex-col items-center text-center gap-4 mb-6">
                                <div className="w-16 h-16 bg-red-50 text-red-500 flex items-center justify-center rounded-xl">
                                    <HiDocumentText className="w-8 h-8" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-gray-900 mb-1">PDF Document</h3>
                                    <p className="text-gray-500 font-medium text-sm">Download or open the course materials below</p>
                                </div>
                            </div>
                            {docDownloadUrl && (
                                <div className="flex flex-wrap justify-center gap-3">
                                    <a
                                        href={docDownloadUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-md transition-colors"
                                    >
                                        <HiDownload className="w-5 h-5" />
                                        Download PDF
                                    </a>
                                    {isDrive && (
                                        <a
                                            href={pdfUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-colors"
                                        >
                                            Open in Google Drive
                                        </a>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="prose max-w-none text-gray-700 ql-editor px-0"
                            dangerouslySetInnerHTML={{ __html: lesson.content || lesson.description || '' }} />
                    </div>
                );
            }

            case 'QUIZ':
                return lesson.quiz ? (
                    <QuizPlayer quiz={lesson.quiz} onComplete={(result) => {
                        if (result.passed && onComplete) onComplete();
                    }} />
                ) : (
                    <div className="text-center p-20 bg-gray-50 border-2 border-dashed border-gray-200">
                        <HiClipboardList className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-500 font-bold">No quiz data found for this lesson.</p>
                    </div>
                );

            case 'ASSIGNMENT':
                return (
                    <div className="bg-white p-8 md:p-12 shadow-sm border border-gray-100 space-y-8">
                        <div className="flex items-center gap-4 border-b border-gray-50 pb-6">
                            <div className="w-12 h-12 bg-purple-50 text-purple-500 flex items-center justify-center">
                                <HiClipboardList className="w-6 h-6" />
                            </div>
                            <h3 className="text-2xl font-black text-gray-900">Assignment Details</h3>
                        </div>
                        <div className="prose max-w-none text-gray-800 leading-relaxed ql-editor px-0"
                            dangerouslySetInnerHTML={{ __html: lesson.content || lesson.description || '' }} />
                        {lesson.attachmentUrl && (
                            <div className="pt-6 border-t border-gray-50">
                                <a
                                    href={getDocumentOpenUrl(lesson.attachmentUrl)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-[var(--primary-700)] font-black hover:underline"
                                >
                                    <HiDownload className="w-5 h-5" />
                                    Download attachment
                                </a>
                            </div>
                        )}
                    </div>
                );

            default:
                return <div>Unsupported lesson type</div>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h2 className="text-3xl font-black text-gray-900 tracking-tight">{lesson.title}</h2>
                {lesson.lessonType === 'VIDEO' && lesson.videoDuration && (
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                        Duration: {Math.floor(lesson.videoDuration / 60)} minutes
                    </p>
                )}
            </div>
            {renderContent()}
        </div>
    );
};
