'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { createClient } from '@/lib/supabase/client';
import { Class, User, Submission } from '@/types';

interface StudentAnalytics {
  student: User;
  totalAttempted: number;
  totalCorrect: number;
  accuracy: number;
  avgTime: number;
}

export default function AnalyticsPage() {
  const supabase = createClient();
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [analytics, setAnalytics] = useState<StudentAnalytics[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadClasses() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('classes').select('*').eq('teacher_id', user.id);
      setClasses(data ?? []);
    }
    loadClasses();
  }, []);

  useEffect(() => {
    if (!selectedClass) return;

    async function loadAnalytics() {
      setLoading(true);

      // Get students in class
      const { data: csData } = await supabase
        .from('class_students')
        .select('*, student:users(*)')
        .eq('class_id', selectedClass);

      const students = csData?.map((cs: { student: User }) => cs.student) ?? [];

      // Get assignments for class
      const { data: assignments } = await supabase
        .from('assignments')
        .select('id')
        .eq('class_id', selectedClass);

      const assignmentIds = assignments?.map(a => a.id) ?? [];

      const results: StudentAnalytics[] = [];

      for (const student of students) {
        let submissions: Submission[] = [];
        if (assignmentIds.length > 0) {
          const { data: subs } = await supabase
            .from('submissions')
            .select('*')
            .eq('student_id', student.id)
            .in('assignment_id', assignmentIds);
          submissions = subs ?? [];
        }

        const totalAttempted = submissions.length;
        const totalCorrect = submissions.filter(s => s.is_correct).length;
        const accuracy = totalAttempted > 0 ? totalCorrect / totalAttempted : 0;
        const avgTime = totalAttempted > 0
          ? submissions.reduce((sum, s) => sum + (s.time_spent_sec ?? 0), 0) / totalAttempted
          : 0;

        results.push({
          student,
          totalAttempted,
          totalCorrect,
          accuracy,
          avgTime: Math.round(avgTime),
        });
      }

      // Sort by accuracy descending
      results.sort((a, b) => b.accuracy - a.accuracy);
      setAnalytics(results);
      setLoading(false);
    }

    loadAnalytics();
  }, [selectedClass]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">학생 분석</h1>

      <div className="max-w-xs">
        <Select value={selectedClass} onValueChange={setSelectedClass}>
          <SelectTrigger><SelectValue placeholder="반을 선택하세요" /></SelectTrigger>
          <SelectContent>
            {classes.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedClass && (
        <Card>
          <CardHeader>
            <CardTitle>학생별 분석</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center text-muted-foreground py-8">로딩 중...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>이름</TableHead>
                    <TableHead>시도</TableHead>
                    <TableHead>정답</TableHead>
                    <TableHead>정확도</TableHead>
                    <TableHead>평균 시간</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.map(a => (
                    <TableRow key={a.student.id}>
                      <TableCell className="font-medium">{a.student.name}</TableCell>
                      <TableCell>{a.totalAttempted}</TableCell>
                      <TableCell>{a.totalCorrect}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={a.accuracy * 100} className="w-20" />
                          <span className="text-sm">{Math.round(a.accuracy * 100)}%</span>
                        </div>
                      </TableCell>
                      <TableCell>{a.avgTime}초</TableCell>
                    </TableRow>
                  ))}
                  {analytics.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        데이터가 없습니다.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
