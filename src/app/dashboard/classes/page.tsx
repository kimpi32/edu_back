'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { createClient } from '@/lib/supabase/client';
import { Class } from '@/types';

export default function ClassesPage() {
  const supabase = createClient();
  const [classes, setClasses] = useState<Class[]>([]);
  const [studentCounts, setStudentCounts] = useState<Record<string, number>>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [className, setClassName] = useState('');

  const loadClasses = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: cls } = await supabase
      .from('classes')
      .select('*')
      .eq('teacher_id', user.id)
      .order('created_at', { ascending: false });
    setClasses(cls ?? []);

    // Get student counts
    const counts: Record<string, number> = {};
    for (const c of cls ?? []) {
      const { count } = await supabase
        .from('class_students')
        .select('*', { count: 'exact', head: true })
        .eq('class_id', c.id);
      counts[c.id] = count ?? 0;
    }
    setStudentCounts(counts);
  };

  useEffect(() => { loadClasses(); }, []);

  const handleCreate = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !className.trim()) return;

    await supabase.from('classes').insert({
      name: className.trim(),
      teacher_id: user.id,
    });

    setClassName('');
    setDialogOpen(false);
    loadClasses();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('반을 삭제하시겠습니까?')) return;
    await supabase.from('classes').delete().eq('id', id);
    loadClasses();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">반 관리</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>+ 반 만들기</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>새 반 만들기</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>반 이름</Label>
                <Input
                  value={className}
                  onChange={e => setClassName(e.target.value)}
                  placeholder="예: 3학년 2반"
                  onKeyDown={e => e.key === 'Enter' && handleCreate()}
                />
              </div>
              <Button onClick={handleCreate} className="w-full" disabled={!className.trim()}>
                만들기
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {classes.map(c => (
          <Card key={c.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle>{c.name}</CardTitle>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(c.id)}>삭제</Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                학생 {studentCounts[c.id] ?? 0}명
              </p>
              <Link href={`/dashboard/classes/${c.id}`}>
                <Button variant="outline" size="sm" className="w-full">상세 보기</Button>
              </Link>
            </CardContent>
          </Card>
        ))}
        {classes.length === 0 && (
          <p className="col-span-2 text-center text-muted-foreground py-8">
            반이 없습니다. 새 반을 만들어보세요.
          </p>
        )}
      </div>
    </div>
  );
}
