'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Problem, Submission, Sequence, Assignment } from '@/types';

interface SequencePlayerData {
  assignment: Assignment | null;
  sequence: Sequence | null;
  problems: Problem[];
  submissions: Submission[];
  loading: boolean;
  error: string | null;
}

export function useSequencePlayer(assignmentId: string): SequencePlayerData {
  const [data, setData] = useState<SequencePlayerData>({
    assignment: null,
    sequence: null,
    problems: [],
    submissions: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();

      try {
        // 1. Assignment 조회
        const { data: assignment, error: aErr } = await supabase
          .from('assignments')
          .select('*')
          .eq('id', assignmentId)
          .single();

        if (aErr) throw aErr;

        // 2. Sequence 조회
        const { data: sequence, error: sErr } = await supabase
          .from('sequences')
          .select('*')
          .eq('id', assignment.sequence_id)
          .single();

        if (sErr) throw sErr;

        // 3. Sequence의 문제들 (순서대로)
        const { data: seqProblems, error: spErr } = await supabase
          .from('sequence_problems')
          .select('*, problem:problems(*)')
          .eq('sequence_id', assignment.sequence_id)
          .order('position', { ascending: true });

        if (spErr) throw spErr;

        const problems = seqProblems?.map((sp: { problem: Problem }) => sp.problem) ?? [];

        // 4. 기존 풀이 기록
        const { data: { user } } = await supabase.auth.getUser();
        let submissions: Submission[] = [];
        if (user) {
          const { data: subs } = await supabase
            .from('submissions')
            .select('*')
            .eq('assignment_id', assignmentId)
            .eq('student_id', user.id)
            .order('attempted_at', { ascending: true });
          submissions = subs ?? [];
        }

        setData({
          assignment,
          sequence,
          problems,
          submissions,
          loading: false,
          error: null,
        });
      } catch (err) {
        setData(prev => ({
          ...prev,
          loading: false,
          error: err instanceof Error ? err.message : '데이터를 불러올 수 없습니다.',
        }));
      }
    }

    loadData();
  }, [assignmentId]);

  return data;
}
