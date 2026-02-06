'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
import { Sequence } from '@/types';

export default function DashboardSequencesPage() {
  const supabase = createClient();
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [problemCounts, setProblemCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    async function load() {
      const { data: seqs } = await supabase
        .from('sequences')
        .select('*')
        .order('created_at', { ascending: false });
      setSequences(seqs ?? []);

      const counts: Record<string, number> = {};
      for (const seq of seqs ?? []) {
        const { count } = await supabase
          .from('sequence_problems')
          .select('*', { count: 'exact', head: true })
          .eq('sequence_id', seq.id);
        counts[seq.id] = count ?? 0;
      }
      setProblemCounts(counts);
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">문제 시퀀스</h1>

      <div className="grid grid-cols-2 gap-4">
        {sequences.map(seq => (
          <Link key={seq.id} href={`/dashboard/sequences/${seq.id}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{seq.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">{seq.description || '설명 없음'}</p>
                <Badge variant="outline">{problemCounts[seq.id] ?? 0}문제</Badge>
              </CardContent>
            </Card>
          </Link>
        ))}
        {sequences.length === 0 && (
          <p className="col-span-2 text-center text-muted-foreground py-8">
            시퀀스가 없습니다.
          </p>
        )}
      </div>
    </div>
  );
}
