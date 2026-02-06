import { Problem } from '@/types';

/**
 * AI 튜터 - 최소한의 힌트 제공
 * 서버 사이드에서만 사용 (API Route)
 */
export async function getHint(problem: Problem, previousAttempts: string[]): Promise<string> {
  const response = await fetch('/api/hint', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      expression: problem.expression,
      answer: problem.answer,
      previousAttempts,
      hint: problem.hint,
    }),
  });

  if (!response.ok) {
    throw new Error('힌트를 가져올 수 없습니다');
  }

  const data = await response.json();
  return data.hint;
}
