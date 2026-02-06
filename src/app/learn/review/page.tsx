'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import KaTeXRenderer from '@/components/math/KaTeXRenderer';
import { createClient } from '@/lib/supabase/client';
import { Submission, Problem } from '@/types';

interface WrongAnswer {
  problem: Problem;
  submissions: Submission[];
  latestAttempt: string;
}

export default function ReviewPage() {
  const supabase = createClient();
  const [wrongAnswers, setWrongAnswers] = useState<WrongAnswer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get all wrong submissions
      const { data: wrongSubs } = await supabase
        .from('submissions')
        .select('*, problem:problems(*)')
        .eq('student_id', user.id)
        .eq('is_correct', false)
        .order('attempted_at', { ascending: false });

      if (!wrongSubs) {
        setLoading(false);
        return;
      }

      // Also check if problem was eventually solved correctly
      const { data: correctSubs } = await supabase
        .from('submissions')
        .select('problem_id')
        .eq('student_id', user.id)
        .eq('is_correct', true);

      const solvedIds = new Set(correctSubs?.map(s => s.problem_id) ?? []);

      // Group by problem, only show unsolved
      const problemMap = new Map<string, WrongAnswer>();
      for (const sub of wrongSubs) {
        if (solvedIds.has(sub.problem_id)) continue;
        if (!problemMap.has(sub.problem_id)) {
          problemMap.set(sub.problem_id, {
            problem: sub.problem,
            submissions: [],
            latestAttempt: sub.attempted_at,
          });
        }
        problemMap.get(sub.problem_id)!.submissions.push(sub);
      }

      setWrongAnswers(Array.from(problemMap.values()));
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="text-center py-8">로딩 중...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">오답 복습</h1>

      {wrongAnswers.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">복습할 오답이 없습니다.</p>
            <p className="text-sm text-muted-foreground mt-1">틀린 문제가 여기에 나타납니다.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {wrongAnswers.map(wa => (
            <Card key={wa.problem.id}>
              <CardContent className="py-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-lg">
                    <KaTeXRenderer expression={wa.problem.expression} displayMode={false} />
                  </div>
                  <Badge variant="destructive">
                    {wa.submissions.length}회 오답
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  <span>시도한 답: </span>
                  {wa.submissions.map((s, idx) => (
                    <span key={s.id}>
                      {idx > 0 && ', '}
                      <span className="text-red-500">{s.answer}</span>
                    </span>
                  ))}
                </div>
                {wa.problem.hint && (
                  <p className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
                    힌트: {wa.problem.hint}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
