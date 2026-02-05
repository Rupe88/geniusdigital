'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import * as lessonApi from '@/lib/api/lessons';
import * as progressApi from '@/lib/api/progress';
import * as quizApi from '@/lib/api/quizzes';
import { Lesson } from '@/lib/types/course';
import { LessonPlayer } from '@/components/player/LessonPlayer';
import { Button } from '@/components/ui/Button';
import { HiCheckCircle, HiChevronLeft, HiChevronRight } from 'react-icons/hi';
import { showSuccess } from '@/lib/utils/toast';
import { useLearn } from '@/lib/context/LearnContext';

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const { course, getNextLesson, getPrevLesson, refreshProgress } = useLearn();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (params.lessonId) {
      fetchLesson(params.lessonId as string);
    }
  }, [params.lessonId]);

  const fetchLesson = async (id: string) => {
    try {
      setLoading(true);
      setLesson(null);
      const data = await lessonApi.getLessonById(id);
      if (data.lessonType === 'QUIZ' && !data.quiz) {
        try {
          const quizData = await quizApi.getQuizByLesson(data.id);
          data.quiz = quizData;
        } catch (err) {
          console.error('Error fetching quiz data:', err);
          data.quiz = undefined;
        }
      }
      if (data.lessonType === 'QUIZ' && data.quiz && !Array.isArray(data.quiz.questions)) {
        (data.quiz as { questions: unknown }).questions = [];
      }
      setLoadError(null);
      setLesson(data);
    } catch (error) {
      console.error('Error fetching lesson:', error);
      setLesson(null);
      setLoadError(error instanceof Error ? error.message : 'Failed to load lesson');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!lesson) return;
    try {
      setCompleting(true);
      await progressApi.completeLesson(lesson.id);
      showSuccess('Lesson completed!');
      await refreshProgress();
    } catch (error) {
      console.error('Error completing lesson:', error);
    } finally {
      setCompleting(false);
    }
  };

  const nextLesson = lesson && course ? getNextLesson(lesson.id) : null;
  const prevLesson = lesson && course ? getPrevLesson(lesson.id) : null;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-12 h-12 border-4 border-[var(--primary-600)] border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 font-medium">Loading lesson...</p>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="text-center py-20 px-4">
        <p className="text-gray-700 font-medium mb-2">
          {loadError?.toLowerCase().includes('enroll')
            ? 'Please enroll in this course to access lessons.'
            : loadError || 'Lesson not found'}
        </p>
        {course && (
          <Button
            variant="outline"
            size="md"
            onClick={() => router.push(`/courses/${course.id}`)}
            className="mt-4"
          >
            Back to course
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <LessonPlayer lesson={lesson} onComplete={handleComplete} />

      <div className="mt-8 pt-6 border-t border-gray-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {prevLesson && (
            <Button
              variant="outline"
              size="md"
              onClick={() => router.push(`/courses/${course!.id}/learn/${prevLesson.id}`)}
              className="rounded-lg"
            >
              <HiChevronLeft className="w-5 h-5 mr-1" />
              Previous
            </Button>
          )}
          {nextLesson && (
            <Button
              variant="primary"
              size="md"
              onClick={() => router.push(`/courses/${course!.id}/learn/${nextLesson.id}`)}
              className="rounded-lg"
            >
              Next
              <HiChevronRight className="w-5 h-5 ml-1" />
            </Button>
          )}
        </div>
        <Button
          variant="primary"
          size="lg"
          onClick={handleComplete}
          isLoading={completing}
          className="rounded-lg px-6 font-semibold"
        >
          Mark as Completed
          <HiCheckCircle className="ml-2 w-5 h-5" />
        </Button>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
