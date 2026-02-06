'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import ConceptTree from '@/components/concept/ConceptTree';
import MasteryBadge from '@/components/concept/MasteryBadge';
import { useConceptTree } from '@/hooks/useConceptTree';
import { createClient } from '@/lib/supabase/client';

export default function ProgressPage() {
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalAttempted: 0,
    totalCorrect: 0,
    avgMastery: 0,
    conceptsStarted: 0,
    conceptsMastered: 0,
  });

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      // Load stats
      const { data: submissions } = await supabase
        .from('submissions')
        .select('is_correct')
        .eq('student_id', user.id);

      const totalAttempted = submissions?.length ?? 0;
      const totalCorrect = submissions?.filter(s => s.is_correct).length ?? 0;

      const { data: mastery } = await supabase
        .from('concept_mastery')
        .select('mastery_level')
        .eq('student_id', user.id);

      const conceptsStarted = mastery?.length ?? 0;
      const conceptsMastered = mastery?.filter(m => m.mastery_level >= 0.8).length ?? 0;
      const avgMastery = conceptsStarted > 0
        ? mastery!.reduce((sum, m) => sum + m.mastery_level, 0) / conceptsStarted
        : 0;

      setStats({ totalAttempted, totalCorrect, avgMastery, conceptsStarted, conceptsMastered });
    }
    load();
  }, []);

  const { tree, loading } = useConceptTree(userId ?? undefined);

  return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">내 진도</h1>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">총 시도</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.totalAttempted}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">정답</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.totalCorrect}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">평균 마스터리</CardTitle>
            </CardHeader>
            <CardContent>
              <MasteryBadge level={stats.avgMastery} size="lg" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">마스터 개념</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {stats.conceptsMastered}/{stats.conceptsStarted}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Accuracy bar */}
        <Card>
          <CardHeader>
            <CardTitle>정확도</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Progress
                value={stats.totalAttempted > 0 ? (stats.totalCorrect / stats.totalAttempted) * 100 : 0}
                className="flex-1"
              />
              <span className="text-sm font-medium">
                {stats.totalAttempted > 0
                  ? Math.round((stats.totalCorrect / stats.totalAttempted) * 100)
                  : 0}%
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Concept Tree with mastery */}
        <Card>
          <CardHeader>
            <CardTitle>개념별 마스터리</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center text-muted-foreground py-8">로딩 중...</p>
            ) : tree.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">개념 데이터가 없습니다.</p>
            ) : (
              <ConceptTree nodes={tree} showMastery />
            )}
          </CardContent>
        </Card>
      </div>
  );
}
