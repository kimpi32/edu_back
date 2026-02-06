'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import KaTeXRenderer from './KaTeXRenderer';
import { Problem } from '@/types';

interface ProblemCardProps {
  problem: Problem;
  index?: number;
  isCorrect?: boolean | null;
  studentAnswer?: string;
  showAnswer?: boolean;
}

export default function ProblemCard({
  problem,
  index,
  isCorrect,
  studentAnswer,
  showAnswer = false,
}: ProblemCardProps) {
  return (
    <Card className={`${isCorrect === true ? 'border-green-300 bg-green-50' : isCorrect === false ? 'border-red-300 bg-red-50' : ''}`}>
      <CardContent className="flex items-center gap-4 py-3">
        {index !== undefined && (
          <span className="text-sm text-muted-foreground w-6">#{index + 1}</span>
        )}
        <div className="flex-1">
          <KaTeXRenderer expression={problem.expression} displayMode={false} />
        </div>
        {isCorrect !== null && isCorrect !== undefined && (
          <Badge variant={isCorrect ? 'default' : 'destructive'}>
            {isCorrect ? '정답' : '오답'}
          </Badge>
        )}
        {studentAnswer && (
          <span className="text-sm text-muted-foreground">
            답: {studentAnswer}
          </span>
        )}
        {showAnswer && (
          <span className="text-sm font-medium">
            정답: {problem.answer}
          </span>
        )}
      </CardContent>
    </Card>
  );
}
