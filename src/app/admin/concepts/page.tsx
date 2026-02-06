'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import ConceptTree from '@/components/concept/ConceptTree';
import { createClient } from '@/lib/supabase/client';
import { Concept, ConceptLevel, ConceptTreeNode } from '@/types';

function buildTree(concepts: Concept[]): ConceptTreeNode[] {
  const nodeMap = new Map<string, ConceptTreeNode>();
  concepts.forEach(c => nodeMap.set(c.id, { ...c, children: [] }));

  const roots: ConceptTreeNode[] = [];
  concepts.forEach(c => {
    const node = nodeMap.get(c.id)!;
    if (c.parent_id && nodeMap.has(c.parent_id)) {
      nodeMap.get(c.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  function sortChildren(nodes: ConceptTreeNode[]) {
    nodes.sort((a, b) => a.sort_order - b.sort_order);
    nodes.forEach(n => sortChildren(n.children));
  }
  sortChildren(roots);
  return roots;
}

export default function AdminConceptsPage() {
  const supabase = createClient();
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [tree, setTree] = useState<ConceptTreeNode[]>([]);
  const [selectedId, setSelectedId] = useState<string>();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingConcept, setEditingConcept] = useState<Concept | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [level, setLevel] = useState<ConceptLevel>('small');
  const [parentId, setParentId] = useState<string>('');
  const [gradeRange, setGradeRange] = useState('');
  const [sortOrder, setSortOrder] = useState('0');

  const loadConcepts = async () => {
    const { data } = await supabase
      .from('concepts')
      .select('*')
      .order('sort_order');
    if (data) {
      setConcepts(data);
      setTree(buildTree(data));
    }
  };

  useEffect(() => { loadConcepts(); }, []);

  const resetForm = () => {
    setName('');
    setLevel('small');
    setParentId('');
    setGradeRange('');
    setSortOrder('0');
    setEditingConcept(null);
  };

  const openCreate = (parentIdDefault?: string) => {
    resetForm();
    if (parentIdDefault) setParentId(parentIdDefault);
    setDialogOpen(true);
  };

  const openEdit = (concept: Concept) => {
    setEditingConcept(concept);
    setName(concept.name);
    setLevel(concept.level);
    setParentId(concept.parent_id || '');
    setGradeRange(concept.grade_range?.join(',') || '');
    setSortOrder(String(concept.sort_order));
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const gradeArr = gradeRange
      ? gradeRange.split(',').map(Number).filter(n => !isNaN(n))
      : [];

    const payload = {
      name,
      level,
      parent_id: parentId || null,
      grade_range: gradeArr,
      sort_order: parseInt(sortOrder) || 0,
    };

    if (editingConcept) {
      await supabase.from('concepts').update(payload).eq('id', editingConcept.id);
    } else {
      await supabase.from('concepts').insert(payload);
    }

    setDialogOpen(false);
    resetForm();
    loadConcepts();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    await supabase.from('concepts').delete().eq('id', id);
    loadConcepts();
  };

  const selectedConcept = concepts.find(c => c.id === selectedId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">개념 트리 관리</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openCreate()}>+ 개념 추가</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingConcept ? '개념 수정' : '새 개념 추가'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>이름</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="예: 공통인수 묶기" />
              </div>
              <div className="space-y-2">
                <Label>레벨</Label>
                <Select value={level} onValueChange={(v) => setLevel(v as ConceptLevel)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="large">대개념</SelectItem>
                    <SelectItem value="medium">중개념</SelectItem>
                    <SelectItem value="small">소개념</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>상위 개념</Label>
                <Select value={parentId} onValueChange={setParentId}>
                  <SelectTrigger><SelectValue placeholder="없음 (최상위)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">없음 (최상위)</SelectItem>
                    {concepts.filter(c => c.id !== editingConcept?.id).map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name} ({c.level})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>학년 범위 (쉼표 구분)</Label>
                <Input value={gradeRange} onChange={e => setGradeRange(e.target.value)} placeholder="예: 3,4" />
              </div>
              <div className="space-y-2">
                <Label>정렬 순서</Label>
                <Input type="number" value={sortOrder} onChange={e => setSortOrder(e.target.value)} />
              </div>
              <Button onClick={handleSave} className="w-full">
                {editingConcept ? '수정' : '추가'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>개념 트리</CardTitle>
          </CardHeader>
          <CardContent>
            {tree.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">개념이 없습니다. 새 개념을 추가하세요.</p>
            ) : (
              <ConceptTree
                nodes={tree}
                onSelect={(node) => setSelectedId(node.id)}
                selectedId={selectedId}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>상세 정보</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedConcept ? (
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-muted-foreground">이름</span>
                  <p className="font-medium">{selectedConcept.name}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">레벨</span>
                  <div className="mt-1">
                    <Badge>
                      {selectedConcept.level === 'large' ? '대개념' : selectedConcept.level === 'medium' ? '중개념' : '소개념'}
                    </Badge>
                  </div>
                </div>
                {selectedConcept.grade_range?.length > 0 && (
                  <div>
                    <span className="text-sm text-muted-foreground">학년 범위</span>
                    <p>{selectedConcept.grade_range.join('~')}학년</p>
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline" onClick={() => openEdit(selectedConcept)}>수정</Button>
                  <Button size="sm" variant="outline" onClick={() => openCreate(selectedConcept.id)}>하위 개념 추가</Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(selectedConcept.id)}>삭제</Button>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">개념을 선택하세요</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
