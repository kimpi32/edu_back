'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import KaTeXRenderer from './KaTeXRenderer';
import AnswerInput from './AnswerInput';
import ProblemCard from './ProblemCard';
import { Problem, Submission } from '@/types';
import { createClient } from '@/lib/supabase/client';

interface SequencePlayerProps {
  sequenceName: string;
  problems: Problem[];
  assignmentId: string;
  existingSubmissions?: Submission[];
  onComplete?: () => void;
  onRequestHint?: (problem: Problem) => void;
}

interface SubmissionRecord {
  problem: Problem;
  answer: string;
  isCorrect: boolean;
}

export default function SequencePlayer({
  sequenceName,
  problems,
  assignmentId,
  existingSubmissions = [],
  onComplete,
  onRequestHint,
}: SequencePlayerProps) {
  const supabase = createClient();

  // Find first unsolved problem
  const solvedIds = new Set(
    existingSubmissions.filter(s => s.is_correct).map(s => s.problem_id)
  );
  const initialIndex = problems.findIndex(p => !solvedIds.has(p.id));
  const startIndex = initialIndex === -1 ? problems.length : initialIndex;

  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [history, setHistory] = useState<SubmissionRecord[]>(
    existingSubmissions.map(s => ({
      problem: problems.find(p => p.id === s.problem_id)!,
      answer: s.answer,
      isCorrect: s.is_correct,
    })).filter(s => s.problem)
  );
  const [startTime, setStartTime] = useState(Date.now());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentProblem = problems[currentIndex];
  const isComplete = currentIndex >= problems.length;
  const progressPercent = (currentIndex / problems.length) * 100;

  const handleSubmit = useCallback(async (answer: string) => {
    if (!currentProblem || isSubmitting) return;
    setIsSubmitting(true);

    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    const normalizedAnswer = answer.replace(/\s/g, '');
    const normalizedCorrect = currentProblem.answer.replace(/\s/g, '');
    const isCorrect = normalizedAnswer === normalizedCorrect;

    // Save to DB
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('submissions').insert({
        student_id: user.id,
        problem_id: currentProblem.id,
        assignment_id: assignmentId,
        answer,
        is_correct: isCorrect,
        time_spent_sec: timeSpent,
      });
    }

    setHistory(prev => [...prev, {
      problem: currentProblem,
      answer,
      isCorrect,
    }]);

    if (isCorrect) {
      setCurrentIndex(prev => prev + 1);
      setStartTime(Date.now());
    }

    setIsSubmitting(false);

    if (isCorrect && currentIndex + 1 >= problems.length) {
      onComplete?.();
    }
  }, [currentProblem, isSubmitting, startTime, supabase, assignmentId, currentIndex, problems.length, onComplete]);

  if (isComplete) {
    const correctCount = history.filter(h => h.isCorrect).length;
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-green-600">시퀀스 완료!</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-lg">{sequenceName}</p>
            <p className="text-muted-foreground">
              {problems.length}문제 중 {correctCount}문제 정답
            </p>
          </CardContent>
        </Card>

        <div className="space-y-2">
          <h3 className="font-medium">풀이 히스토리</h3>
          {history.map((record, idx) => (
            <ProblemCard
              key={idx}
              problem={record.problem}
              index={idx}
              isCorrect={record.isCorrect}
              studentAnswer={record.answer}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-medium">{sequenceName}</h2>
        <div className="flex items-center gap-3 mt-2">
          <Progress value={progressPercent} className="flex-1" />
          <span className="text-sm text-muted-foreground">
            {currentIndex + 1}/{problems.length}
          </span>
        </div>
      </div>

      {/* Current Problem */}
      <Card className="border-2">
        <CardContent className="flex flex-col items-center py-12 space-y-8">
          <div className="text-3xl">
            <KaTeXRenderer expression={currentProblem.expression} />
          </div>
          <AnswerInput
            answerType={currentProblem.answer_type}
            onSubmit={handleSubmit}
            disabled={isSubmitting}
          />
          {onRequestHint && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRequestHint(currentProblem)}
              className="text-muted-foreground"
            >
              힌트
            </Button>
          )}
        </CardContent>
      </Card>

      {/* History */}
      {history.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">이전 풀이</h3>
          {history.slice().reverse().map((record, idx) => (
            <div
              key={idx}
              className={`flex items-center gap-3 text-sm px-3 py-2 rounded ${
                record.isCorrect ? 'text-green-700' : 'text-red-600'
              }`}
            >
              <Badge variant={record.isCorrect ? 'default' : 'destructive'} className="w-5 h-5 p-0 flex items-center justify-center text-xs">
                {record.isCorrect ? 'O' : 'X'}
              </Badge>
              <KaTeXRenderer expression={record.problem.expression} displayMode={false} className="flex-1" />
              <span>{record.isCorrect ? `= ${record.answer}` : `(오답: ${record.answer})`}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
