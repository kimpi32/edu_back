'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import KaTeXRenderer from '@/components/math/KaTeXRenderer';
import { createClient } from '@/lib/supabase/client';
import { Sequence, Problem } from '@/types';

export default function SequenceDetailPage() {
  const params = useParams();
  const seqId = params.id as string;
  const supabase = createClient();

  const [sequence, setSequence] = useState<Sequence | null>(null);
  const [problems, setProblems] = useState<Problem[]>([]);

  useEffect(() => {
    async function load() {
      const { data: seq } = await supabase
        .from('sequences')
        .select('*')
        .eq('id', seqId)
        .single();
      setSequence(seq);

      const { data: sps } = await supabase
        .from('sequence_problems')
        .select('*, problem:problems(*)')
        .eq('sequence_id', seqId)
        .order('position');

      setProblems(sps?.map((sp: { problem: Problem }) => sp.problem) ?? []);
    }
    load();
  }, [seqId]);

  if (!sequence) return <div>로딩 중...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{sequence.name}</h1>
        {sequence.description && (
          <p className="text-muted-foreground mt-1">{sequence.description}</p>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>문제 목록 ({problems.length}개)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {problems.map((p, idx) => (
            <div key={p.id} className="flex items-center gap-4 py-2 border-b last:border-b-0">
              <Badge variant="outline" className="w-8 h-8 flex items-center justify-center">
                {idx + 1}
              </Badge>
              <div className="flex-1">
                <KaTeXRenderer expression={p.expression} displayMode={false} />
              </div>
              <span className="text-sm text-muted-foreground">정답: {p.answer}</span>
              <Badge>{'★'.repeat(p.difficulty)}</Badge>
            </div>
          ))}
          {problems.length === 0 && (
            <p className="text-center text-muted-foreground py-4">문제가 없습니다.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
