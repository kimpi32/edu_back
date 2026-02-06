'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import KaTeXRenderer from '@/components/math/KaTeXRenderer';
import { createClient } from '@/lib/supabase/client';
import { Sequence, Problem } from '@/types';

export default function AdminSequencesPage() {
  const supabase = createClient();
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [allProblems, setAllProblems] = useState<Problem[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSequence, setEditingSequence] = useState<Sequence | null>(null);
  const [previewSequenceId, setPreviewSequenceId] = useState<string | null>(null);
  const [previewProblems, setPreviewProblems] = useState<Problem[]>([]);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedProblems, setSelectedProblems] = useState<Problem[]>([]);

  const loadData = async () => {
    const [{ data: seqs }, { data: probs }] = await Promise.all([
      supabase.from('sequences').select('*').order('created_at', { ascending: false }),
      supabase.from('problems').select('*').order('created_at', { ascending: false }),
    ]);
    setSequences(seqs ?? []);
    setAllProblems(probs ?? []);
  };

  useEffect(() => { loadData(); }, []);

  const resetForm = () => {
    setName('');
    setDescription('');
    setSelectedProblems([]);
    setEditingSequence(null);
  };

  const openEdit = async (seq: Sequence) => {
    setEditingSequence(seq);
    setName(seq.name);
    setDescription(seq.description || '');

    const { data: sps } = await supabase
      .from('sequence_problems')
      .select('*, problem:problems(*)')
      .eq('sequence_id', seq.id)
      .order('position');

    setSelectedProblems(sps?.map((sp: { problem: Problem }) => sp.problem) ?? []);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let seqId: string;

    if (editingSequence) {
      await supabase.from('sequences').update({ name, description: description || null }).eq('id', editingSequence.id);
      seqId = editingSequence.id;
      await supabase.from('sequence_problems').delete().eq('sequence_id', seqId);
    } else {
      const { data } = await supabase
        .from('sequences')
        .insert({ name, description: description || null, created_by: user.id })
        .select()
        .single();
      if (!data) return;
      seqId = data.id;
    }

    // Add problems in order
    if (selectedProblems.length > 0) {
      await supabase.from('sequence_problems').insert(
        selectedProblems.map((p, idx) => ({
          sequence_id: seqId,
          problem_id: p.id,
          position: idx + 1,
        }))
      );
    }

    setDialogOpen(false);
    resetForm();
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    await supabase.from('sequences').delete().eq('id', id);
    loadData();
  };

  const addProblem = (problem: Problem) => {
    if (!selectedProblems.find(p => p.id === problem.id)) {
      setSelectedProblems(prev => [...prev, problem]);
    }
  };

  const removeProblem = (index: number) => {
    setSelectedProblems(prev => prev.filter((_, i) => i !== index));
  };

  const moveProblem = (index: number, direction: 'up' | 'down') => {
    setSelectedProblems(prev => {
      const newArr = [...prev];
      const swapIdx = direction === 'up' ? index - 1 : index + 1;
      if (swapIdx < 0 || swapIdx >= newArr.length) return prev;
      [newArr[index], newArr[swapIdx]] = [newArr[swapIdx], newArr[index]];
      return newArr;
    });
  };

  const loadPreview = async (seqId: string) => {
    if (previewSequenceId === seqId) {
      setPreviewSequenceId(null);
      return;
    }
    const { data } = await supabase
      .from('sequence_problems')
      .select('*, problem:problems(*)')
      .eq('sequence_id', seqId)
      .order('position');

    setPreviewProblems(data?.map((sp: { problem: Problem }) => sp.problem) ?? []);
    setPreviewSequenceId(seqId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">시퀀스 관리</h1>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setDialogOpen(true); }}>+ 시퀀스 추가</Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingSequence ? '시퀀스 수정' : '새 시퀀스'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>이름</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="곱셈에서 인수분해로" />
              </div>
              <div className="space-y-2">
                <Label>설명</Label>
                <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="시퀀스 설명..." rows={2} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Available problems */}
                <div className="space-y-2">
                  <Label>문제 목록</Label>
                  <div className="border rounded max-h-60 overflow-y-auto">
                    {allProblems.map(p => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between px-3 py-2 hover:bg-muted cursor-pointer border-b last:border-b-0"
                        onClick={() => addProblem(p)}
                      >
                        <KaTeXRenderer expression={p.expression} displayMode={false} />
                        <Button size="sm" variant="ghost">+</Button>
                      </div>
                    ))}
                    {allProblems.length === 0 && (
                      <p className="text-center text-muted-foreground py-4">문제 없음</p>
                    )}
                  </div>
                </div>

                {/* Selected problems (ordered) */}
                <div className="space-y-2">
                  <Label>시퀀스 순서 ({selectedProblems.length}개)</Label>
                  <div className="border rounded max-h-60 overflow-y-auto">
                    {selectedProblems.map((p, idx) => (
                      <div key={`${p.id}-${idx}`} className="flex items-center gap-2 px-3 py-2 border-b last:border-b-0">
                        <span className="text-xs text-muted-foreground w-5">{idx + 1}</span>
                        <KaTeXRenderer expression={p.expression} displayMode={false} className="flex-1" />
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => moveProblem(idx, 'up')} disabled={idx === 0}>↑</Button>
                          <Button size="sm" variant="ghost" onClick={() => moveProblem(idx, 'down')} disabled={idx === selectedProblems.length - 1}>↓</Button>
                          <Button size="sm" variant="ghost" onClick={() => removeProblem(idx)}>×</Button>
                        </div>
                      </div>
                    ))}
                    {selectedProblems.length === 0 && (
                      <p className="text-center text-muted-foreground py-4">문제를 추가하세요</p>
                    )}
                  </div>
                </div>
              </div>

              <Button onClick={handleSave} className="w-full" disabled={!name || selectedProblems.length === 0}>
                {editingSequence ? '수정' : '추가'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>시퀀스 목록 ({sequences.length}개)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>이름</TableHead>
                <TableHead>설명</TableHead>
                <TableHead>작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sequences.map(seq => (
                <>
                  <TableRow key={seq.id}>
                    <TableCell className="font-medium">{seq.name}</TableCell>
                    <TableCell className="text-muted-foreground">{seq.description || '-'}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => loadPreview(seq.id)}>
                          {previewSequenceId === seq.id ? '접기' : '미리보기'}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => openEdit(seq)}>수정</Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(seq.id)}>삭제</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  {previewSequenceId === seq.id && (
                    <TableRow key={`${seq.id}-preview`}>
                      <TableCell colSpan={3}>
                        <div className="space-y-2 py-2">
                          {previewProblems.map((p, idx) => (
                            <div key={p.id} className="flex items-center gap-3 text-sm">
                              <Badge variant="outline">{idx + 1}</Badge>
                              <KaTeXRenderer expression={p.expression} displayMode={false} />
                              <span className="text-muted-foreground">= {p.answer}</span>
                            </div>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))}
              {sequences.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                    시퀀스가 없습니다. 새 시퀀스를 추가하세요.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
