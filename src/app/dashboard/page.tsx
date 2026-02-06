'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { Class, Assignment, Sequence } from '@/types';

export default function DashboardPage() {
  const supabase = createClient();
  const [classes, setClasses] = useState<Class[]>([]);
  const [recentAssignments, setRecentAssignments] = useState<(Assignment & { sequence: Sequence; class: Class })[]>([]);
  const [stats, setStats] = useState({ totalStudents: 0, totalAssignments: 0, totalSubmissions: 0 });

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load classes
      const { data: cls } = await supabase
        .from('classes')
        .select('*')
        .eq('teacher_id', user.id);
      setClasses(cls ?? []);

      // Load recent assignments
      const classIds = cls?.map(c => c.id) ?? [];
      if (classIds.length > 0) {
        const { data: assigns } = await supabase
          .from('assignments')
          .select('*, sequence:sequences(*), class:classes(*)')
          .in('class_id', classIds)
          .order('created_at', { ascending: false })
          .limit(5);
        setRecentAssignments(assigns ?? []);
      }

      // Stats
      let totalStudents = 0;
      if (classIds.length > 0) {
        const { count } = await supabase
          .from('class_students')
          .select('*', { count: 'exact', head: true })
          .in('class_id', classIds);
        totalStudents = count ?? 0;
      }

      const { count: subCount } = await supabase
        .from('submissions')
        .select('*', { count: 'exact', head: true });

      setStats({
        totalStudents,
        totalAssignments: recentAssignments.length,
        totalSubmissions: subCount ?? 0,
      });
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">교사 대시보드</h1>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">내 반</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{classes.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">총 학생</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.totalStudents}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">총 제출</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.totalSubmissions}</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="flex gap-3">
        <Link href="/dashboard/classes">
          <Button variant="outline">반 관리</Button>
        </Link>
        <Link href="/dashboard/assign">
          <Button variant="outline">시퀀스 배정</Button>
        </Link>
        <Link href="/dashboard/analytics">
          <Button variant="outline">학생 분석</Button>
        </Link>
      </div>

      {/* Recent assignments */}
      <Card>
        <CardHeader>
          <CardTitle>최근 배정</CardTitle>
        </CardHeader>
        <CardContent>
          {recentAssignments.length > 0 ? (
            <div className="space-y-3">
              {recentAssignments.map(a => (
                <div key={a.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                  <div>
                    <p className="font-medium">{a.sequence?.name}</p>
                    <p className="text-sm text-muted-foreground">{a.class?.name}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(a.created_at).toLocaleDateString('ko-KR')}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">배정된 시퀀스가 없습니다.</p>
          )}
        </CardContent>
      </Card>

      {/* Classes overview */}
      <Card>
        <CardHeader>
          <CardTitle>내 반 목록</CardTitle>
        </CardHeader>
        <CardContent>
          {classes.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {classes.map(c => (
                <Link key={c.id} href={`/dashboard/classes/${c.id}`}>
                  <Card className="hover:bg-muted/50 cursor-pointer transition-colors">
                    <CardContent className="py-4">
                      <p className="font-medium">{c.name}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              반이 없습니다.{' '}
              <Link href="/dashboard/classes" className="text-primary underline">
                반 만들기
              </Link>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
