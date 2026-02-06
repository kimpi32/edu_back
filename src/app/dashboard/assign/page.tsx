'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { Class, Sequence } from '@/types';

export default function AssignPage() {
  const supabase = createClient();
  const { toast } = useToast();
  const [classes, setClasses] = useState<Class[]>([]);
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSequence, setSelectedSequence] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data: cls }, { data: seqs }] = await Promise.all([
        supabase.from('classes').select('*').eq('teacher_id', user.id),
        supabase.from('sequences').select('*').order('created_at', { ascending: false }),
      ]);
      setClasses(cls ?? []);
      setSequences(seqs ?? []);
    }
    load();
  }, []);

  const handleAssign = async () => {
    if (!selectedClass || !selectedSequence) return;
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('assignments').insert({
      class_id: selectedClass,
      sequence_id: selectedSequence,
      assigned_by: user.id,
      due_date: dueDate || null,
    });

    if (error) {
      toast({ title: '오류', description: '배정에 실패했습니다.', variant: 'destructive' });
    } else {
      toast({ title: '성공', description: '시퀀스가 배정되었습니다.' });
      setSelectedClass('');
      setSelectedSequence('');
      setDueDate('');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">시퀀스 배정</h1>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>새 배정</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>반 선택</Label>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger><SelectValue placeholder="반을 선택하세요" /></SelectTrigger>
              <SelectContent>
                {classes.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>시퀀스 선택</Label>
            <Select value={selectedSequence} onValueChange={setSelectedSequence}>
              <SelectTrigger><SelectValue placeholder="시퀀스를 선택하세요" /></SelectTrigger>
              <SelectContent>
                {sequences.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>마감일 (선택)</Label>
            <Input
              type="datetime-local"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
            />
          </div>

          <Button
            onClick={handleAssign}
            className="w-full"
            disabled={!selectedClass || !selectedSequence || loading}
          >
            {loading ? '배정 중...' : '배정하기'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
