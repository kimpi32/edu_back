'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import KaTeXRenderer from '@/components/math/KaTeXRenderer';
import { createClient } from '@/lib/supabase/client';
import { Problem, AnswerType, Concept } from '@/types';

export default function AdminProblemsPage() {
  const supabase = createClient();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProblem, setEditingProblem] = useState<Problem | null>(null);

  // Form state
  const [expression, setExpression] = useState('');
  const [answer, setAnswer] = useState('');
  const [answerType, setAnswerType] = useState<AnswerType>('number');
  const [difficulty, setDifficulty] = useState('1');
  const [hint, setHint] = useState('');
  const [selectedConcepts, setSelectedConcepts] = useState<string[]>([]);
  const [primaryConcept, setPrimaryConcept] = useState('');

  const loadData = async () => {
    const [{ data: probs }, { data: cons }] = await Promise.all([
      supabase.from('problems').select('*').order('created_at', { ascending: false }),
      supabase.from('concepts').select('*').order('sort_order'),
    ]);
    setProblems(probs ?? []);
    setConcepts(cons ?? []);
  };

  useEffect(() => { loadData(); }, []);

  const resetForm = () => {
    setExpression('');
    setAnswer('');
    setAnswerType('number');
    setDifficulty('1');
    setHint('');
    setSelectedConcepts([]);
    setPrimaryConcept('');
    setEditingProblem(null);
  };

  const openEdit = async (problem: Problem) => {
    setEditingProblem(problem);
    setExpression(problem.expression);
    setAnswer(problem.answer);
    setAnswerType(problem.answer_type);
    setDifficulty(String(problem.difficulty));
    setHint(problem.hint || '');

    // Load concept tags
    const { data: pcs } = await supabase
      .from('problem_concepts')
      .select('concept_id, is_primary')
      .eq('problem_id', problem.id);

    if (pcs) {
      setSelectedConcepts(pcs.map(pc => pc.concept_id));
      const primary = pcs.find(pc => pc.is_primary);
      setPrimaryConcept(primary?.concept_id || '');
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const payload = {
      expression,
      answer,
      answer_type: answerType,
      difficulty: parseInt(difficulty),
      hint: hint || null,
    };

    let problemId: string;

    if (editingProblem) {
      await supabase.from('problems').update(payload).eq('id', editingProblem.id);
      problemId = editingProblem.id;
      // Remove old concept tags
      await supabase.from('problem_concepts').delete().eq('problem_id', problemId);
    } else {
      const { data } = await supabase.from('problems').insert(payload).select().single();
      if (!data) return;
      problemId = data.id;
    }

    // Add concept tags
    if (selectedConcepts.length > 0) {
      await supabase.from('problem_concepts').insert(
        selectedConcepts.map(cid => ({
          problem_id: problemId,
          concept_id: cid,
          is_primary: cid === primaryConcept,
        }))
      );
    }

    setDialogOpen(false);
    resetForm();
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    await supabase.from('problems').delete().eq('id', id);
    loadData();
  };

  const toggleConcept = (id: string) => {
    setSelectedConcepts(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">문제 관리</h1>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setDialogOpen(true); }}>+ 문제 추가</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProblem ? '문제 수정' : '새 문제 추가'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>수식 (KaTeX 문법)</Label>
                <Textarea
                  value={expression}
                  onChange={e => setExpression(e.target.value)}
                  placeholder="예: 9 \times 111 = ?"
                  rows={2}
                />
                {expression && (
                  <div className="p-3 border rounded bg-muted/30">
                    <span className="text-xs text-muted-foreground">미리보기:</span>
                    <div className="mt-1">
                      <KaTeXRenderer expression={expression} />
                    </div>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>정답</Label>
                  <Input value={answer} onChange={e => setAnswer(e.target.value)} placeholder="999" />
                </div>
                <div className="space-y-2">
                  <Label>답 유형</Label>
                  <Select value={answerType} onValueChange={v => setAnswerType(v as AnswerType)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="number">숫자</SelectItem>
                      <SelectItem value="expression">수식</SelectItem>
                      <SelectItem value="select">선택</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>난이도 (1~5)</Label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4,5].map(d => (
                      <SelectItem key={d} value={String(d)}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>힌트 (선택)</Label>
                <Input value={hint} onChange={e => setHint(e.target.value)} placeholder="패턴을 관찰해보세요" />
              </div>
              <div className="space-y-2">
                <Label>개념 태그</Label>
                <div className="flex flex-wrap gap-2 p-3 border rounded max-h-40 overflow-y-auto">
                  {concepts.filter(c => c.level === 'small').map(c => (
                    <Badge
                      key={c.id}
                      variant={selectedConcepts.includes(c.id) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleConcept(c.id)}
                    >
                      {c.name}
                    </Badge>
                  ))}
                </div>
                {selectedConcepts.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs">주요 개념</Label>
                    <Select value={primaryConcept} onValueChange={setPrimaryConcept}>
                      <SelectTrigger><SelectValue placeholder="선택..." /></SelectTrigger>
                      <SelectContent>
                        {selectedConcepts.map(cid => {
                          const c = concepts.find(c => c.id === cid);
                          return c ? (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ) : null;
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <Button onClick={handleSave} className="w-full">
                {editingProblem ? '수정' : '추가'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>문제 목록 ({problems.length}개)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>수식</TableHead>
                <TableHead>정답</TableHead>
                <TableHead>유형</TableHead>
                <TableHead>난이도</TableHead>
                <TableHead>작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {problems.map(p => (
                <TableRow key={p.id}>
                  <TableCell>
                    <KaTeXRenderer expression={p.expression} displayMode={false} />
                  </TableCell>
                  <TableCell>{p.answer}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{p.answer_type}</Badge>
                  </TableCell>
                  <TableCell>{'★'.repeat(p.difficulty)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEdit(p)}>수정</Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(p.id)}>삭제</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {problems.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    문제가 없습니다. 새 문제를 추가하세요.
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
