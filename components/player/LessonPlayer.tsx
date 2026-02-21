'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Lesson } from '@/lib/types/course';
import { QuizPlayer } from './QuizPlayer';
import { HiDocumentText, HiVideoCamera, HiClipboardList, HiDownload, HiRefresh } from 'react-icons/hi';
import { Button } from '@/components/ui/Button';
import { getYouTubeEmbedUrl } from '@/lib/utils/helpers';
import { getVideoStreamUrl, isSecureStreamPath, isOurS3Url } from '@/lib/api/media';

interface LessonPlayerProps {
    lesson: Lesson;
    onComplete?: () => void;
}

export const LessonPlayer: React.FC<LessonPlayerProps> = ({ lesson, onComplete }) => {
    const [secureVideoSrc, setSecureVideoSrc] = useState<string | null>(null);
    const [secureVideoError, setSecureVideoError] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState(0);
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

    useEffect(() => {
        console.log('[LessonPlayer] useEffect triggered', {
            lessonId: lesson.id,
            lessonType: lesson.lessonType,
            videoUrl: lesson.videoUrl,
        });

        if (lesson.lessonType !== 'VIDEO' || !lesson.videoUrl) {
            console.log('[LessonPlayer] Skipping - not a video lesson or no videoUrl');
            return;
        }

        const isS3 = isOurS3Url(lesson.videoUrl);
        const isStream = isSecureStreamPath(lesson.videoUrl);

        console.log('[LessonPlayer] URL analysis', {
            videoUrl: lesson.videoUrl,
            isS3,
            isStream,
        });

        if (!isS3 && !isStream) {
            console.log('[LessonPlayer] Skipping - URL is not S3 or stream path');
            return;
        }

        // If lesson changed (or retry), reset state and cancel previous request
        if (fetchedForLessonId.current !== null && fetchedForLessonId.current !== lesson.id) {
            console.log('[LessonPlayer] Lesson changed, resetting state');
            setSecureVideoSrc(null);
            setSecureVideoError(null);
            fetchedForLessonId.current = null;
            // Cancel previous request if it exists
            if (abortControllerRef.current) {
                console.log('[LessonPlayer] Aborting previous request');
                abortControllerRef.current.abort();
                abortControllerRef.current = null;
            }
        }
        
        // Only skip if we already have a result (success or error) for this lesson
        if (fetchedForLessonId.current === lesson.id && (secureVideoSrc || secureVideoError)) {
            console.log('[LessonPlayer] Already fetched for this lesson, skipping');
            return;
        }
        
        // If we're already fetching for this lesson, don't start another request
        if (abortControllerRef.current && fetchedForLessonId.current === lesson.id) {
            console.log('[LessonPlayer] Already fetching for this lesson, skipping');
            return;
        }
        
        // Mark as fetching to prevent duplicate requests
        fetchedForLessonId.current = lesson.id;
        
        // Create abort controller for this request
        const abortController = new AbortController();
        abortControllerRef.current = abortController;
        
        setSecureVideoError(null);
        
        console.log('[LessonPlayer] Fetching video stream URL for lesson:', lesson.id);
        const startTime = Date.now();
        
        getVideoStreamUrl({ lessonId: lesson.id })
            .then((url) => {
                // Check if request was aborted
                if (abortController.signal.aborted) {
                    console.log('[LessonPlayer] Request was aborted, ignoring response');
                    return;
                }
                
                const duration = Date.now() - startTime;
                console.log('[LessonPlayer] Video stream URL received', {
                    url,
                    duration: `${duration}ms`,
                });
                
                // Verify we're still on the same lesson
                if (fetchedForLessonId.current !== lesson.id) {
                    console.log('[LessonPlayer] Lesson changed during fetch, ignoring response');
                    return;
                }
                
                console.log('[LessonPlayer] Setting secureVideoSrc');
                setSecureVideoSrc(url);
                abortControllerRef.current = null;
            })
            .catch((err) => {
                // Check if request was aborted
                if (abortController.signal.aborted) {
                    console.log('[LessonPlayer] Request was aborted, ignoring error');
                    return;
                }
                
                const duration = Date.now() - startTime;
                console.error('[LessonPlayer] Failed to get video stream URL', {
                    error: err,
                    message: err instanceof Error ? err.message : String(err),
                    duration: `${duration}ms`,
                });
                
                // Verify we're still on the same lesson
                if (fetchedForLessonId.current !== lesson.id) {
                    console.log('[LessonPlayer] Lesson changed during fetch, ignoring error');
                    return;
                }
                
                const errorMessage = err instanceof Error ? err.message : 'Could not load video';
                console.log('[LessonPlayer] Setting error state:', errorMessage);
                setSecureVideoError(errorMessage);
                // Reset on error so we can retry
                fetchedForLessonId.current = null;
                abortControllerRef.current = null;
            });
            
        return () => {
            // Only abort if the lesson has actually changed
            if (fetchedForLessonId.current !== lesson.id) {
                console.log('[LessonPlayer] Cleanup: aborting request (lesson changed)');
                abortController.abort();
                abortControllerRef.current = null;
            } else {
                console.log('[LessonPlayer] Cleanup: not aborting (same lesson)');
            }
        };
    }, [lesson.id, lesson.lessonType, lesson.videoUrl, retryCount]);

    const renderContent = () => {
        switch (lesson.lessonType) {
            case 'VIDEO': {
                const youtubeUrl = lesson.videoUrl ? getYouTubeEmbedUrl(lesson.videoUrl) : null;
                const videoSrc = isSecureStreamPath(lesson.videoUrl) ? secureVideoSrc : lesson.videoUrl;
                
                console.log('[LessonPlayer] Rendering video', {
                    youtubeUrl,
                    videoSrc,
                    secureVideoSrc,
                    secureVideoError,
                    isSecureStream: isSecureStreamPath(lesson.videoUrl),
                    originalVideoUrl: lesson.videoUrl,
                });
                
                return (
                    <div className="space-y-6">
                        <div className="aspect-video bg-black shadow-2xl">
                            {youtubeUrl ? (
                                <iframe
                                    src={youtubeUrl}
                                    className="w-full h-full"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
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
                                    onLoadStart={() => {
                                        console.log('[Video] onLoadStart - Starting to load video', {
                                            src: videoSrc,
                                            networkState: (document.querySelector('video') as HTMLVideoElement)?.networkState,
                                        });
                                    }}
                                    onLoadedMetadata={(e) => {
                                        const v = e.currentTarget;
                                        console.log('[Video] onLoadedMetadata - Metadata loaded', {
                                            duration: v.duration,
                                            videoWidth: v.videoWidth,
                                            videoHeight: v.videoHeight,
                                            readyState: v.readyState,
                                            networkState: v.networkState,
                                        });
                                    }}
                                    onLoadedData={() => {
                                        console.log('[Video] onLoadedData - First frame loaded');
                                    }}
                                    onCanPlay={() => {
                                        console.log('[Video] onCanPlay - Video can start playing');
                                    }}
                                    onCanPlayThrough={() => {
                                        console.log('[Video] onCanPlayThrough - Video can play through without buffering');
                                    }}
                                    onWaiting={() => {
                                        console.log('[Video] onWaiting - Waiting for data');
                                    }}
                                    onStalled={() => {
                                        console.log('[Video] onStalled - Media loading stalled');
                                    }}
                                    onProgress={() => {
                                        const v = document.querySelector('video') as HTMLVideoElement;
                                        if (v) {
                                            const buffered = v.buffered;
                                            if (buffered.length > 0) {
                                                console.log('[Video] onProgress - Buffered ranges:', {
                                                    length: buffered.length,
                                                    start: buffered.start(0),
                                                    end: buffered.end(buffered.length - 1),
                                                    duration: v.duration,
                                                });
                                            }
                                        }
                                    }}
                                    onError={(e) => {
                                        const v = e.currentTarget;
                                        const errorMsg = v?.error?.message || 'Video playback failed';
                                        const errorCode = v?.error?.code;
                                        console.error('[Video] onError - Video playback error', {
                                            message: errorMsg,
                                            code: errorCode,
                                            networkState: v?.networkState,
                                            readyState: v?.readyState,
                                            src: videoSrc,
                                            error: v?.error,
                                        });
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

            case 'PDF':
                return (
                    <div className="space-y-6">
                        <div className="bg-white p-12 shadow-sm border border-gray-100 flex flex-col items-center text-center gap-6">
                            <div className="w-24 h-24 bg-red-50 text-red-500 flex items-center justify-center">
                                <HiDocumentText className="w-12 h-12" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-gray-900 mb-2">PDF Document</h3>
                                <p className="text-gray-500 font-medium">Download or view the course materials below</p>
                            </div>
                            {lesson.attachmentUrl && (
                                <a
                                    href={lesson.attachmentUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-black shadow-lg transition-all"
                                >
                                    <HiDownload className="w-5 h-5" />
                                    Download PDF
                                </a>
                            )}
                        </div>
                        <div className="prose max-w-none text-gray-700 ql-editor px-0"
                            dangerouslySetInnerHTML={{ __html: lesson.content || lesson.description || '' }} />
                    </div>
                );

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
                                    href={lesson.attachmentUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-[var(--primary-700)] font-black hover:underline"
                                >
                                    <HiDownload className="w-5 h-5" />
                                    Attachment.zip
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
