'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { createClient } from '@/lib/supabase/client';
import { Assignment, Sequence, Class } from '@/types';

interface AssignmentWithDetails extends Assignment {
  sequence: Sequence;
  class: Class;
  totalProblems: number;
  solvedProblems: number;
}

export default function LearnPage() {
  const supabase = createClient();
  const [assignments, setAssignments] = useState<AssignmentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get classes the student is enrolled in
      const { data: enrollments } = await supabase
        .from('class_students')
        .select('class_id')
        .eq('student_id', user.id);

      const classIds = enrollments?.map(e => e.class_id) ?? [];
      if (classIds.length === 0) {
        setLoading(false);
        return;
      }

      // Get assignments for those classes
      const { data: assigns } = await supabase
        .from('assignments')
        .select('*, sequence:sequences(*), class:classes(*)')
        .in('class_id', classIds)
        .order('created_at', { ascending: false });

      // Get progress for each assignment
      const results: AssignmentWithDetails[] = [];
      for (const a of assigns ?? []) {
        // Count total problems in sequence
        const { count: totalProblems } = await supabase
          .from('sequence_problems')
          .select('*', { count: 'exact', head: true })
          .eq('sequence_id', a.sequence_id);

        // Count solved problems
        const { data: subs } = await supabase
          .from('submissions')
          .select('problem_id, is_correct')
          .eq('assignment_id', a.id)
          .eq('student_id', user.id)
          .eq('is_correct', true);

        const solvedProblems = new Set(subs?.map(s => s.problem_id)).size;

        results.push({
          ...a,
          totalProblems: totalProblems ?? 0,
          solvedProblems,
        });
      }

      setAssignments(results);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="text-center py-8">로딩 중...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">내 학습</h1>

      {assignments.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">배정된 학습이 없습니다.</p>
            <p className="text-sm text-muted-foreground mt-1">교사가 시퀀스를 배정하면 여기에 나타납니다.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assignments.map(a => {
            const isComplete = a.solvedProblems >= a.totalProblems;
            const progressPercent = a.totalProblems > 0 ? (a.solvedProblems / a.totalProblems) * 100 : 0;

            return (
              <Card key={a.id} className={isComplete ? 'border-green-200 bg-green-50/50' : ''}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{a.sequence?.name}</CardTitle>
                    {isComplete && <Badge className="bg-green-600">완료</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">{a.class?.name}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Progress value={progressPercent} className="flex-1" />
                    <span className="text-sm text-muted-foreground">
                      {a.solvedProblems}/{a.totalProblems}
                    </span>
                  </div>
                  {a.due_date && (
                    <p className="text-xs text-muted-foreground">
                      마감: {new Date(a.due_date).toLocaleDateString('ko-KR')}
                    </p>
                  )}
                  <Link href={`/learn/${a.id}`}>
                    <Button className="w-full" variant={isComplete ? 'outline' : 'default'}>
                      {isComplete ? '다시 보기' : a.solvedProblems > 0 ? '이어서 풀기' : '시작하기'}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
