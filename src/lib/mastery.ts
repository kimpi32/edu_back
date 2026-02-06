import { createClient } from '@/lib/supabase/client';

/**
 * 개념 마스터리 계산 및 업데이트
 *
 * 마스터리 = (정답 수 / 시도 수) * 가중치
 * 가중치는 시도 수가 많을수록 안정적 (최소 5문제)
 */
export function calculateMastery(attempted: number, correct: number): number {
  if (attempted === 0) return 0;
  const accuracy = correct / attempted;
  // 시도 수가 적으면 불확실성 반영 (5문제 미만이면 감소)
  const confidence = Math.min(attempted / 5, 1);
  return accuracy * confidence;
}

/**
 * 문제 풀이 후 관련 개념의 마스터리를 업데이트
 */
export async function updateMasteryAfterSubmission(
  studentId: string,
  problemId: string,
  isCorrect: boolean
) {
  const supabase = createClient();

  // 1. 이 문제와 연결된 개념 조회
  const { data: problemConcepts } = await supabase
    .from('problem_concepts')
    .select('concept_id, is_primary')
    .eq('problem_id', problemId);

  if (!problemConcepts?.length) return;

  // 2. 각 개념의 마스터리 업데이트
  for (const pc of problemConcepts) {
    const { data: existing } = await supabase
      .from('concept_mastery')
      .select('*')
      .eq('student_id', studentId)
      .eq('concept_id', pc.concept_id)
      .single();

    const attempted = (existing?.problems_attempted ?? 0) + 1;
    const correct = (existing?.problems_correct ?? 0) + (isCorrect ? 1 : 0);
    const masteryLevel = calculateMastery(attempted, correct);

    await supabase.from('concept_mastery').upsert({
      student_id: studentId,
      concept_id: pc.concept_id,
      mastery_level: masteryLevel,
      problems_attempted: attempted,
      problems_correct: correct,
      updated_at: new Date().toISOString(),
    });
  }
}

/**
 * 학생의 모든 개념 마스터리를 조회
 */
export async function getStudentMastery(studentId: string) {
  const supabase = createClient();

  const { data } = await supabase
    .from('concept_mastery')
    .select(`
      *,
      concept:concepts(*)
    `)
    .eq('student_id', studentId);

  return data ?? [];
}
