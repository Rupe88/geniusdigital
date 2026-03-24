'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Quiz, QuizQuestion } from '@/lib/types/course';
import { QuizResult, submitQuiz } from '@/lib/api/quizzes';
import { showError, showSuccess } from '@/lib/utils/toast';
import { HiCheckCircle, HiXCircle, HiInformationCircle, HiChevronRight, HiChevronLeft, HiRefresh } from 'react-icons/hi';

interface QuizPlayerProps {
    quiz: Quiz;
    onComplete?: (result: QuizResult) => void;
}

const QUESTIONS_SAFE = (q: Quiz | undefined | null): QuizQuestion[] =>
    Array.isArray(q?.questions) ? q.questions : [];

/** Format seconds as MM:SS */
function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = Math.max(0, seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
}

export const QuizPlayer: React.FC<QuizPlayerProps> = ({ quiz, onComplete }) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string | string[]>>({});
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<QuizResult | null>(null);
    const [showExplanation, setShowExplanation] = useState(false);
    const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
    const [timeExpired, setTimeExpired] = useState(false);

    const selectedAnswersRef = useRef(selectedAnswers);
    selectedAnswersRef.current = selectedAnswers;
    const onCompleteRef = useRef(onComplete);
    onCompleteRef.current = onComplete;

    const questions = QUESTIONS_SAFE(quiz);
    const parsedTimeLimit = Number((quiz as any)?.timeLimit);
    const timeLimitMinutes = Number.isFinite(parsedTimeLimit) && parsedTimeLimit > 0 ? parsedTimeLimit : 0;
    const totalSeconds = timeLimitMinutes * 60;
    const currentQuestion = questions[currentQuestionIndex];
    const isLastQuestion = currentQuestionIndex === questions.length - 1;

    const handleSelectAnswer = (answer: string) => {
        if (result || !currentQuestion) return;
        const questionId = currentQuestion.id!;
        if (currentQuestion.questionType === 'multiple_choice') {
            const currentAnswers = (selectedAnswers[questionId] as string[]) || [];
            if (currentAnswers.includes(answer)) {
                setSelectedAnswers({
                    ...selectedAnswers,
                    [questionId]: currentAnswers.filter((a) => a !== answer),
                });
            } else {
                setSelectedAnswers({
                    ...selectedAnswers,
                    [questionId]: [...currentAnswers, answer],
                });
            }
        } else {
            setSelectedAnswers({
                ...selectedAnswers,
                [questionId]: answer,
            });
        }
    };

    const handleTextAnswerChange = (value: string) => {
        if (result || !currentQuestion) return;
        const questionId = currentQuestion.id!;
        setSelectedAnswers({
            ...selectedAnswers,
            [questionId]: value,
        });
    };

    const handleNext = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
            setShowExplanation(false);
        }
    };

    const handlePrevious = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(currentQuestionIndex - 1);
            setShowExplanation(false);
        }
    };

    const handleSubmit = async () => {
        const unansweredCount = questions.filter(q => !selectedAnswers[q.id!]).length;
        if (unansweredCount > 0) {
            if (!confirm(`You have ${unansweredCount} unanswered questions. Are you sure you want to submit?`)) {
                return;
            }
        }

        try {
            setSubmitting(true);
            const quizResult = await submitQuiz(quiz.id, selectedAnswers);
            setResult(quizResult);
            showSuccess('Quiz submitted successfully!');
            if (onComplete) onComplete(quizResult);
        } catch (error) {
            showError(Object(error).message || 'Failed to submit quiz');
        } finally {
            setSubmitting(false);
        }
    };

    const resetQuiz = () => {
        setResult(null);
        setSelectedAnswers({});
        setCurrentQuestionIndex(0);
        setShowExplanation(false);
        setTimeExpired(false);
        if (totalSeconds > 0) setSecondsRemaining(totalSeconds);
    };

    // Initialize timer when quiz has a time limit
    useEffect(() => {
        if (totalSeconds > 0 && result === null && secondsRemaining === null) {
            setSecondsRemaining(totalSeconds);
        }
    }, [totalSeconds, result, secondsRemaining]);

    // Countdown: when it hits 0, auto-submit and show fail (time's up)
    useEffect(() => {
        if (totalSeconds <= 0 || result !== null || secondsRemaining === null || timeExpired) return;

        const id = setInterval(() => {
            setSecondsRemaining((prev) => {
                if (prev === null || prev <= 0) {
                    clearInterval(id);
                    return 0;
                }
                if (prev === 1) {
                    clearInterval(id);
                    setTimeExpired(true);
                    setSubmitting(true);
                    submitQuiz(quiz.id, selectedAnswersRef.current)
                        .then((quizResult) => {
                            setResult(quizResult);
                            showError('Time\'s up! Your answers were submitted automatically.');
                            if (onCompleteRef.current) onCompleteRef.current(quizResult);
                        })
                        .catch((err) => showError(Object(err).message || 'Failed to submit quiz'))
                        .finally(() => setSubmitting(false));
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(id);
    }, [totalSeconds, result, secondsRemaining, timeExpired, quiz.id]);

    // No questions: show empty state instead of crashing
    if (!questions.length) {
        return (
            <Card padding="lg" className="max-w-2xl mx-auto border-2 border-[var(--border)] text-center">
                <HiInformationCircle className="w-14 h-14 text-[var(--muted-foreground)] mx-auto mb-4" />
                <h2 className="text-xl font-bold text-[var(--foreground)] mb-2">No questions yet</h2>
                <p className="text-[var(--muted-foreground)]">This quiz has no questions. You can mark the lesson as complete and continue.</p>
            </Card>
        );
    }

    if (result) {
        // Use normalized counts coming from the API adapter (already based on isCorrect for all question types)
        const displayCorrect = result.correctAnswers;
        const displayTotal = result.totalQuestions || (result.results?.length ?? 0);
        const displayPercentage =
            displayTotal > 0 ? (displayCorrect / displayTotal) * 100 : result.percentage;
        const allCorrect = displayTotal > 0 && displayCorrect === displayTotal;
        // When time expired, always show fail; otherwise treat passed when backend says so or all correct
        const effectivePassed = timeExpired ? false : (result.passed || allCorrect);

        return (
            <Card
                padding="lg"
                className="w-full min-w-0 max-w-4xl mx-auto border-2 border-[var(--border)] overflow-hidden"
            >
                <div className={`p-4 sm:p-6 md:p-8 text-center ${effectivePassed ? 'bg-green-50' : 'bg-red-50'}`}>
                    <div className="flex justify-center mb-4 sm:mb-6">
                        {effectivePassed ? (
                            <HiCheckCircle className="w-14 h-14 sm:w-20 sm:h-20 text-green-500 animate-bounce" />
                        ) : (
                            <HiXCircle className="w-14 h-14 sm:w-20 sm:h-20 text-red-500 animate-pulse" />
                        )}
                    </div>
                    <h2 className="text-xl sm:text-3xl md:text-4xl font-black text-gray-900 mb-2 px-1 break-words">
                        {timeExpired
                            ? "Time's up – You didn't pass"
                            : effectivePassed
                                ? 'Excellent Work!'
                                : 'Keep Practicing!'}
                    </h2>
                    <p className="text-sm sm:text-base md:text-lg font-bold text-gray-600 px-2">
                        You answered{' '}
                        <span className="text-[var(--primary-700)] text-2xl sm:text-3xl mx-1 tabular-nums">
                            {displayCorrect}
                        </span>
                        out of {displayTotal} questions correctly
                    </p>
                    <div className="mt-3 sm:mt-4 inline-block max-w-full px-4 sm:px-6 py-2 rounded-none font-black uppercase tracking-widest text-xs sm:text-sm bg-white shadow-sm break-words">
                        {displayPercentage.toFixed(0)}% Accuracy • {displayCorrect}/{displayTotal} Correct
                    </div>
                </div>

                <div className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8">
                    <h3 className="text-lg sm:text-xl font-black text-gray-900 border-b border-gray-100 pb-3 sm:pb-4">
                        Detailed Review
                    </h3>
                    <div className="space-y-4 sm:space-y-6">
                        {questions.map((q, idx) => {
                            const res = result.results.find(r => r.questionId === q.id);
                            const options = Array.isArray(q.options) ? q.options : [];
                            const isObjective = ['multiple_choice', 'single_choice', 'true_false'].includes(
                                q.questionType || 'single_choice'
                            );
                            return (
                                <div
                                    key={q.id}
                                    className={`p-4 sm:p-6 rounded-none border min-w-0 ${
                                        res?.isCorrect ? 'border-green-100 bg-green-50/30' : 'border-red-100 bg-red-50/30'
                                    }`}
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4 min-w-0">
                                        <span className="flex-shrink-0 w-8 h-8 rounded-none bg-white font-black text-gray-400 flex items-center justify-center border border-gray-100">
                                            {idx + 1}
                                        </span>
                                        <div className="flex-1 min-w-0 space-y-3 sm:space-y-4">
                                            <p className="font-bold text-gray-900 text-base sm:text-lg leading-snug break-words">
                                                {q.question}
                                            </p>

                                            {/* Show options with right/wrong decorations for objective questions */}
                                            {isObjective && options.length > 0 && (
                                                <div className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-2 sm:gap-3">
                                                    {options.map((option: string, oIdx: number) => {
                                                    const isUserAnswer = Array.isArray(res?.userAnswer)
                                                        ? (res?.userAnswer as string[]).includes(option)
                                                        : res?.userAnswer === option;

                                                    const isCorrectAnswer = Array.isArray(res?.correctAnswer)
                                                        ? (res?.correctAnswer as string[]).includes(option)
                                                        : res?.correctAnswer === option;

                                                    let bgColor = 'bg-white';
                                                    let borderColor = 'border-gray-100';
                                                    let icon = null;

                                                    if (isCorrectAnswer) {
                                                        bgColor = 'bg-green-100';
                                                        borderColor = 'border-green-500';
                                                        icon = <HiCheckCircle className="w-5 h-5 text-green-600" />;
                                                    } else if (isUserAnswer && !isCorrectAnswer) {
                                                        bgColor = 'bg-red-100';
                                                        borderColor = 'border-red-500';
                                                        icon = <HiXCircle className="w-5 h-5 text-red-600" />;
                                                    }

                                                        return (
                                                            <div
                                                                key={oIdx}
                                                                className={`flex items-start justify-between gap-2 p-2.5 sm:p-3 rounded-none border-2 min-w-0 ${borderColor} ${bgColor} transition-all`}
                                                            >
                                                                <span className="text-xs sm:text-sm font-bold text-gray-700 break-words min-w-0 flex-1">
                                                                    {option}
                                                                </span>
                                                                <span className="flex-shrink-0">{icon}</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            {/* For subjective questions (short_answer, open_ended, matching) show text answers */}
                                            {!isObjective && (
                                                <div className="mt-3 space-y-1 text-sm">
                                                    <p className="font-semibold text-gray-800">
                                                        Your answer:{' '}
                                                        <span className="font-normal text-gray-700">
                                                            {typeof res?.userAnswer === 'string' && res.userAnswer.trim()
                                                                ? res.userAnswer
                                                                : '—'}
                                                        </span>
                                                    </p>
                                                    {typeof res?.correctAnswer === 'string' && res.correctAnswer.trim() && (
                                                        <p className="font-semibold text-gray-800">
                                                            Expected / model answer:{' '}
                                                            <span className="font-normal text-gray-700">
                                                                {res.correctAnswer}
                                                            </span>
                                                        </p>
                                                    )}
                                                </div>
                                            )}

                                            {q.description && (
                                                <div className="mt-4 p-3 sm:p-4 rounded-none bg-blue-50 text-blue-700 text-xs sm:text-sm font-medium border border-blue-100 flex gap-2 sm:gap-3 min-w-0">
                                                    <HiInformationCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                                    <p className="min-w-0 break-words">{q.description}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="flex justify-center pt-6 sm:pt-8 px-1">
                        <Button
                            variant="outline"
                            size="lg"
                            onClick={resetQuiz}
                            className="rounded-none w-full sm:w-auto max-w-md px-8 sm:px-10 h-12 sm:h-14 font-black"
                        >
                            <HiRefresh className="mr-2 w-5 h-5" /> Retake Quiz
                        </Button>
                    </div>
                </div>
            </Card>
        );
    }

    return (
        <div className="w-full min-w-0 max-w-none mx-auto px-0 space-y-2">
            {/* Header / Progress */}
            <div className="bg-white p-2 sm:p-2.5 rounded-none border border-gray-200 shadow-sm space-y-1.5 min-w-0">
                <div className="min-w-0">
                    <h2 className="text-xs sm:text-sm md:text-base font-black text-gray-900 tracking-tight break-words">
                        {quiz.title}
                    </h2>
                    <p className="text-[9px] sm:text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-0.5">
                        Question {currentQuestionIndex + 1} of {questions.length}
                    </p>
                </div>
                <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-2.5 w-full min-w-0">
                    {/* Mobile: timer on top; desktop: bar grows, timer on the right */}
                    <div className="h-1 bg-gray-100 rounded-full overflow-hidden flex-1 min-w-0 w-full order-2 sm:order-1 sm:min-w-[120px] md:min-w-[160px]">
                        <div
                            className="h-full bg-[var(--primary-700)] transition-all duration-500"
                            style={{
                                width: `${questions.length ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0}%`,
                            }}
                        />
                    </div>
                    {totalSeconds > 0 && secondsRemaining !== null && (
                        <div
                            className={`text-xs sm:text-sm font-black tabular-nums shrink-0 order-1 sm:order-2 sm:text-right ${
                                secondsRemaining < 60 ? 'text-red-600' : 'text-gray-700'
                            }`}
                            aria-live="polite"
                        >
                            Time left: {formatTime(secondsRemaining)}
                        </div>
                    )}
                </div>
            </div>

            {/* Question Card */}
            <Card
                padding="none"
                className="w-full min-w-0 overflow-hidden border border-gray-200 transform transition-all shadow-md"
            >
                <div className="p-2 sm:p-2.5 space-y-2 sm:space-y-2.5 min-w-0">
                    <div className="space-y-1 min-w-0">
                        <span className="inline-block max-w-full px-1.5 py-0.5 sm:px-2 bg-blue-100 text-[var(--primary-700)] rounded-none text-[0.55rem] sm:text-[0.6rem] font-black uppercase tracking-[0.08em] break-words">
                            {(currentQuestion.questionType || 'single_choice').replace('_', ' ')}
                        </span>
                        <h3 className="text-xs sm:text-sm md:text-base font-black text-gray-900 leading-snug break-words">
                            {currentQuestion.question}
                        </h3>
                    </div>

                    {/* 2×2 from ~400px; compact spacing to reduce scrolling */}
                    <div className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-1.5 sm:gap-2 auto-rows-fr min-w-0">
                        {(() => {
                            const questionId = currentQuestion.id!;
                            const questionType = currentQuestion.questionType || 'single_choice';
                            const isObjective = ['multiple_choice', 'single_choice', 'true_false'].includes(questionType);
                            const options = Array.isArray(currentQuestion.options) ? currentQuestion.options : [];

                            if (isObjective && options.length > 0) {
                                return options.map((option: string, index: number) => {
                                    const isSelected =
                                        questionType === 'multiple_choice'
                                            ? ((selectedAnswers[questionId] as string[]) || []).includes(option)
                                            : selectedAnswers[questionId] === option;

                                    return (
                                        <button
                                            key={index}
                                            type="button"
                                            onClick={() => handleSelectAnswer(option)}
                                            className={`flex items-start gap-1.5 p-1.5 sm:p-2 rounded-none border text-left transition-all min-h-[2.35rem] min-[400px]:min-h-[2.6rem] sm:min-h-[2.9rem] h-full min-w-0 touch-manipulation active:scale-[0.99] ${
                                                isSelected
                                                    ? 'border-[var(--primary-700)] bg-blue-50/50 shadow-inner'
                                                    : 'border-gray-100 bg-gray-50 hover:border-gray-200 hover:bg-white'
                                            }`}
                                        >
                                            <div
                                                className={`flex-shrink-0 w-4.5 h-4.5 sm:w-5 sm:h-5 text-[9px] sm:text-[10px] rounded-none flex items-center justify-center font-black ${
                                                    isSelected
                                                        ? 'bg-[var(--primary-700)] text-white'
                                                        : 'bg-white text-gray-400 border border-gray-200'
                                                }`}
                                            >
                                                {String.fromCharCode(65 + index)}
                                            </div>
                                            <span
                                                className={`text-[10px] sm:text-[11px] md:text-xs font-bold flex-1 min-w-0 leading-snug break-words ${
                                                    isSelected ? 'text-[var(--primary-700)]' : 'text-gray-700'
                                                }`}
                                            >
                                                {option}
                                            </span>
                                        </button>
                                    );
                                });
                            }

                            // Subjective question types: show text input/textarea
                            const currentValue = (selectedAnswers[questionId] as string) || '';
                            const placeholder =
                                questionType === 'short_answer'
                                    ? 'Type your short answer here...'
                                    : 'Write your answer here...';

                            return (
                                <textarea
                                    value={currentValue}
                                    onChange={(e) => handleTextAnswerChange(e.target.value)}
                                    placeholder={placeholder}
                                    className="col-span-full w-full min-h-[74px] sm:min-h-[86px] px-2 sm:px-2.5 py-1.5 border border-gray-200 rounded-none bg-white text-xs sm:text-sm text-gray-800 focus:outline-none focus:border-[var(--primary-700)]"
                                />
                            );
                        })()}
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="px-2 sm:px-2.5 py-1.5 sm:py-2 bg-gray-50 border-t border-gray-100 flex flex-col-reverse sm:flex-row justify-stretch sm:justify-between items-stretch sm:items-center gap-1.5 sm:gap-2 min-w-0">
                    <Button
                        variant="ghost"
                        onClick={handlePrevious}
                        disabled={currentQuestionIndex === 0}
                        className="font-bold text-gray-500 w-full sm:w-auto justify-center h-8 sm:h-8.5 text-[11px] sm:text-xs px-3"
                    >
                        <HiChevronLeft className="mr-1.5 h-4 w-4" /> Previous
                    </Button>

                    {isLastQuestion ? (
                        <Button
                            variant="primary"
                            size="lg"
                            onClick={handleSubmit}
                            isLoading={submitting}
                            className="rounded-none w-full sm:w-auto px-4 sm:px-5 h-8 sm:h-8.5 text-[11px] sm:text-xs font-black shadow-md shadow-blue-700/20 active:scale-[0.99] transition-transform justify-center"
                        >
                            Submit Quiz
                        </Button>
                    ) : (
                        <Button
                            variant="primary"
                            size="lg"
                            onClick={handleNext}
                            className="rounded-none w-full sm:w-auto px-4 sm:px-5 h-8 sm:h-8.5 text-[11px] sm:text-xs font-black shadow-md shadow-blue-700/20 active:scale-[0.99] transition-transform justify-center"
                        >
                            Next <HiChevronRight className="ml-1.5 h-4 w-4" />
                        </Button>
                    )}
                </div>
            </Card>
        </div>
    );
};
