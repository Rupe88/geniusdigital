'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Lesson, Quiz } from '@/lib/types/course';
import { QuizPlayer } from './QuizPlayer';
import { HiDocumentText, HiVideoCamera, HiClipboardList, HiDownload, HiRefresh } from 'react-icons/hi';
import { Button } from '@/components/ui/Button';
import { getVideoEmbedUrl, getDocumentOpenUrl, isGoogleClassroomUrl, getGoogleDriveEmbedUrl } from '@/lib/utils/helpers';
import { getVideoStreamUrl, isSecureStreamPath, isOurS3Url } from '@/lib/api/media';
import { getQuizByLesson } from '@/lib/api/quizzes';
import { getMyAttemptsForQuiz, type UserQuizAttempt } from '@/lib/api/userQuizAttempts';

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

  // Quiz data fetched from API (ensures questions array is present)
  const [quizData, setQuizData] = useState<Quiz | null>(lesson.quiz ?? null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizError, setQuizError] = useState<string | null>(null);
  const [consultationReply, setConsultationReply] = useState<UserQuizAttempt | null>(null);

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

  // Fetch quiz for QUIZ lessons so that uploaded questions always show up
  useEffect(() => {
    if (lesson.lessonType !== 'QUIZ') return;

    let cancelled = false;
    setQuizError(null);
    setQuizLoading(true);

    getQuizByLesson(lesson.id)
      .then((quiz) => {
        if (!cancelled && quiz) {
          setQuizData(quiz);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setQuizError(err instanceof Error ? err.message : 'Failed to load quiz');
        }
      })
      .finally(() => {
        if (!cancelled) setQuizLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [lesson.id, lesson.lessonType]);

  // For consultation quizzes: fetch latest visible admin reply (if any)
  useEffect(() => {
    if (lesson.lessonType !== 'QUIZ') return;
    const q = quizData || lesson.quiz;
    const isConsultation = !!(q as any)?.isConsultation;
    const quizId = (q as any)?.id as string | undefined;
    if (!isConsultation || !quizId) {
      setConsultationReply(null);
      return;
    }
    let cancelled = false;
    setConsultationReply(null);
    getMyAttemptsForQuiz(quizId)
      .then((attempts) => {
        if (cancelled) return;
        const latest =
          (attempts || []).find(
            (a) => a.adminVisible && (a.adminNotes || '').trim().length > 0
          ) || null;
        setConsultationReply(latest);
      })
      .catch(() => {
        if (cancelled) return;
        setConsultationReply(null);
      });
    return () => {
      cancelled = true;
    };
  }, [lesson.lessonType, lesson.quiz, quizData]);

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
                const embedUrl = lesson.videoUrl ? getVideoEmbedUrl(lesson.videoUrl, { hideToolbar: true }) : null;
                const isSecureStream = isSecureStreamPath(lesson.videoUrl);
                const videoSrc = isSecureStream ? secureVideoSrc : lesson.videoUrl;

                return (
                    <div className="space-y-6">
                        <div className="aspect-video bg-black shadow-2xl relative overflow-hidden">
                            {embedUrl ? (
                                <>
                                    <iframe
                                        src={embedUrl}
                                        className="w-full h-full"
                                        allow="accelerometer; autoplay; encrypted-media; gyroscope; fullscreen; picture-in-picture"
                                        allowFullScreen
                                        title="Video player"
                                    />
                                    {/* CSS overlay to block Pop-out button (top-right) */}
                                    <div
                                        className="absolute top-2 right-2 w-28 h-12 z-10 rounded-bl"
                                        style={{ pointerEvents: 'auto', cursor: 'default' }}
                                        aria-hidden
                                    />
                                </>
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
                const isClassroom = pdfUrl && isGoogleClassroomUrl(pdfUrl);
                const embedPdfUrl = isDrive ? getGoogleDriveEmbedUrl(pdfUrl, true) : null;

                return (
                    <div className="space-y-6">
                        <div className="bg-white p-8 md:p-12 shadow-sm border border-gray-100">
                            <div className="flex flex-col items-center text-center gap-4 mb-6">
                                <div className="w-16 h-16 bg-red-50 text-red-500 flex items-center justify-center rounded-xl">
                                    <HiDocumentText className="w-8 h-8" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-gray-900 mb-1">PDF Document</h3>
                                    <p className="text-gray-500 font-medium text-sm">
                                        {isClassroom
                                            ? 'Open the document in Google Classroom to view or download'
                                            : 'View, download, or open the course materials below'}
                                    </p>
                                </div>
                            </div>
                            {embedPdfUrl && (
                                <div className="relative w-full aspect-[4/3] min-h-[400px] max-h-[70vh] rounded-lg overflow-hidden border border-gray-200 bg-gray-50 mb-6">
                                    <iframe
                                        src={embedPdfUrl}
                                        className="w-full h-full"
                                        title="PDF Document"
                                        sandbox="allow-scripts allow-same-origin allow-popups"
                                    />
                                    {/* Overlay to block Pop-out button */}
                                    <div
                                        className="absolute top-2 right-2 w-28 h-12 z-10 rounded-bl"
                                        style={{ pointerEvents: 'auto', cursor: 'default' }}
                                        aria-hidden
                                    />
                                </div>
                            )}
                            {docDownloadUrl && (
                                <div className="flex flex-wrap justify-center gap-3">
                                    {isClassroom ? (
                                        <a
                                            href={pdfUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--primary-600)] hover:bg-[var(--primary-700)] text-white font-semibold rounded-lg shadow-md transition-colors"
                                        >
                                            <HiDocumentText className="w-5 h-5" />
                                            Open in Google Classroom
                                        </a>
                                    ) : (
                                        <>
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
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="prose max-w-none text-gray-700 ql-editor px-0"
                            dangerouslySetInnerHTML={{ __html: lesson.content || lesson.description || '' }} />
                    </div>
                );
            }

            case 'QUIZ': {
                const effectiveQuiz = quizData || lesson.quiz;
                const hasQuestions =
                    !!effectiveQuiz && Array.isArray((effectiveQuiz as any).questions) && (effectiveQuiz as any).questions.length > 0;

                // While we are still loading questions for this quiz (and nothing to show yet),
                // render a skeleton instead of the "No questions yet" empty state.
                if (quizLoading && !hasQuestions) {
                    return (
                        <div className="max-w-3xl mx-auto space-y-6">
                            <div className="bg-white p-6 rounded-none border border-gray-200 shadow-sm flex items-center justify-between">
                                <div className="space-y-2">
                                    <div className="h-5 w-40 bg-gray-100 rounded-md animate-pulse" />
                                    <div className="h-3 w-28 bg-gray-100 rounded-md animate-pulse" />
                                </div>
                                <div className="w-36 md:w-48 h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full w-1/3 bg-gray-200 animate-pulse" />
                                </div>
                            </div>
                            <div className="bg-white rounded-none border border-gray-200 shadow-sm p-8 space-y-6">
                                <div className="h-4 w-32 bg-gray-100 rounded-md animate-pulse" />
                                <div className="h-6 w-3/4 bg-gray-100 rounded-md animate-pulse" />
                                <div className="space-y-3 pt-4">
                                    {Array.from({ length: 4 }).map((_, idx) => (
                                        <div key={idx} className="flex items-center gap-4">
                                            <div className="w-8 h-8 rounded-md bg-gray-100 animate-pulse" />
                                            <div className="flex-1 h-10 rounded-md bg-gray-100 animate-pulse" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    );
                }

                if (quizError && !quizData) {
                    return (
                        <div className="text-center p-20 bg-gray-50 border-2 border-dashed border-gray-200">
                            <HiClipboardList className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                            <p className="text-gray-500 font-bold">Could not load quiz for this lesson.</p>
                            <p className="text-sm text-gray-400 mt-2">{quizError}</p>
                        </div>
                    );
                }

                if (!effectiveQuiz) {
                    return (
                        <div className="text-center p-20 bg-gray-50 border-2 border-dashed border-gray-200">
                            <HiClipboardList className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                            <p className="text-gray-500 font-bold">No quiz data found for this lesson.</p>
                        </div>
                    );
                }

                return (
                    <div className="space-y-3 min-w-0 w-full">
                        {(effectiveQuiz as any)?.isConsultation && consultationReply?.adminVisible && consultationReply.adminNotes && (
                            <div className="border border-[var(--border)] bg-[var(--muted)]/30 p-4 rounded-md">
                                <div className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider mb-1">
                                    Consultation quiz
                                </div>
                                <div className="space-y-2">
                                    <div className="text-sm font-semibold text-[var(--foreground)]">Admin reply</div>
                                    <div className="text-sm text-[var(--foreground)] whitespace-pre-wrap">
                                        {consultationReply.adminNotes}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="w-full">
                            <QuizPlayer
                                quiz={effectiveQuiz as any}
                                onComplete={(result) => {
                                    if (result.passed && onComplete) onComplete();
                                }}
                            />
                        </div>
                    </div>
                );
            }

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
                                    {isGoogleClassroomUrl(lesson.attachmentUrl) ? (
                                        <>Open in Google Classroom</>
                                    ) : (
                                        <><HiDownload className="w-5 h-5" /> Download attachment</>
                                    )}
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
        <div className="space-y-3 min-w-0 w-full">
            <div className="space-y-2 min-w-0">
                <h2 className="text-lg sm:text-xl md:text-2xl font-black text-gray-900 tracking-tight break-words">
                    {lesson.title}
                </h2>
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
