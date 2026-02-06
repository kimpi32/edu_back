'use client';

import { useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import SequencePlayer from '@/components/math/SequencePlayer';
import { useSequencePlayer } from '@/hooks/useSequencePlayer';
import { useToast } from '@/hooks/use-toast';
import { Problem } from '@/types';
import { getHint } from '@/lib/ai-tutor';

export default function SolvePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const assignmentId = params.assignmentId as string;

  const { assignment, sequence, problems, submissions, loading, error } = useSequencePlayer(assignmentId);
  const [hintText, setHintText] = useState<string | null>(null);
  const [hintLoading, setHintLoading] = useState(false);

  const handleComplete = useCallback(() => {
    toast({
      title: '시퀀스 완료!',
      description: '모든 문제를 풀었습니다.',
    });
  }, [toast]);

  const handleRequestHint = useCallback(async (problem: Problem) => {
    setHintLoading(true);
    try {
      const hint = await getHint(problem, []);
      setHintText(hint);
    } catch {
      toast({ title: '오류', description: '힌트를 가져올 수 없습니다.', variant: 'destructive' });
    }
    setHintLoading(false);
  }, [toast]);

  if (loading) {
    return <div className="text-center py-12">로딩 중...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">{error}</p>
        <Button onClick={() => router.push('/learn')} className="mt-4">돌아가기</Button>
      </div>
    );
  }

  if (!sequence || !assignment || problems.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">시퀀스를 찾을 수 없습니다.</p>
        <Button onClick={() => router.push('/learn')} className="mt-4">돌아가기</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.push('/learn')}>
          ← 목록으로
        </Button>
      </div>

      <SequencePlayer
        sequenceName={sequence.name}
        problems={problems}
        assignmentId={assignmentId}
        existingSubmissions={submissions}
        onComplete={handleComplete}
        onRequestHint={handleRequestHint}
      />

      {/* Hint display */}
      {(hintText || hintLoading) && (
        <Card className="max-w-2xl mx-auto border-blue-200 bg-blue-50">
          <CardContent className="py-4">
            {hintLoading ? (
              <p className="text-sm text-blue-600">힌트 생성 중...</p>
            ) : (
              <div>
                <p className="text-xs text-blue-400 mb-1">힌트</p>
                <p className="text-sm text-blue-700">{hintText}</p>
                <Button
                  size="sm"
                  variant="ghost"
                  className="mt-2 text-blue-400"
                  onClick={() => setHintText(null)}
                >
                  닫기
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
