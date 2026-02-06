'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ConceptTree from '@/components/concept/ConceptTree';
import { useConceptTree } from '@/hooks/useConceptTree';

export default function DashboardConceptsPage() {
  const { tree, loading } = useConceptTree();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">개념 트리</h1>

      <Card>
        <CardHeader>
          <CardTitle>전체 개념 트리</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-muted-foreground py-8">로딩 중...</p>
          ) : tree.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">개념이 없습니다.</p>
          ) : (
            <ConceptTree nodes={tree} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
