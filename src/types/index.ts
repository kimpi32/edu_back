// ============================================
// 개념 트리 (Concept Tree)
// ============================================

export type ConceptLevel = 'small' | 'medium' | 'large';

export interface Concept {
  id: string;
  name: string;
  level: ConceptLevel;
  parent_id: string | null;
  grade_range: number[];
  sort_order: number;
  created_at: string;
  // joined
  children?: Concept[];
  parent?: Concept;
}

// ============================================
// 문제 (Problems)
// ============================================

export type AnswerType = 'number' | 'expression' | 'select';

export interface Problem {
  id: string;
  expression: string;       // KaTeX 문법
  answer: string;
  answer_type: AnswerType;
  difficulty: number;        // 1~5
  hint: string | null;
  created_at: string;
  // joined
  concepts?: ProblemConcept[];
}

export interface ProblemConcept {
  problem_id: string;
  concept_id: string;
  is_primary: boolean;
  // joined
  concept?: Concept;
  problem?: Problem;
}

// ============================================
// 문제 시퀀스 (Sequences)
// ============================================

export interface Sequence {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
  // joined
  problems?: SequenceProblem[];
  creator?: User;
}

export interface SequenceProblem {
  sequence_id: string;
  problem_id: string;
  position: number;
  // joined
  problem?: Problem;
}

// ============================================
// 사용자 (Users)
// ============================================

export type UserRole = 'teacher' | 'student' | 'admin';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  created_at: string;
}

// ============================================
// 반 (Classes)
// ============================================

export interface Class {
  id: string;
  name: string;
  teacher_id: string;
  created_at: string;
  // joined
  teacher?: User;
  students?: ClassStudent[];
}

export interface ClassStudent {
  class_id: string;
  student_id: string;
  joined_at: string;
  // joined
  student?: User;
}

// ============================================
// 배정 (Assignments)
// ============================================

export interface Assignment {
  id: string;
  class_id: string;
  sequence_id: string;
  assigned_by: string;
  due_date: string | null;
  created_at: string;
  // joined
  class?: Class;
  sequence?: Sequence;
  assigner?: User;
}

// ============================================
// 학생 풀이 기록 (Submissions)
// ============================================

export interface Submission {
  id: string;
  student_id: string;
  problem_id: string;
  assignment_id: string;
  answer: string;
  is_correct: boolean;
  time_spent_sec: number | null;
  attempted_at: string;
  // joined
  problem?: Problem;
}

// ============================================
// 개념 마스터리 (Concept Mastery)
// ============================================

export interface ConceptMastery {
  student_id: string;
  concept_id: string;
  mastery_level: number;    // 0.0 ~ 1.0
  problems_attempted: number;
  problems_correct: number;
  updated_at: string;
  // joined
  concept?: Concept;
}

// ============================================
// API / UI 헬퍼 타입
// ============================================

export interface SequencePlayerState {
  assignment: Assignment;
  sequence: Sequence;
  problems: (SequenceProblem & { problem: Problem })[];
  currentIndex: number;
  submissions: Submission[];
}

export interface ConceptTreeNode extends Concept {
  children: ConceptTreeNode[];
  mastery?: number;
}

export interface StudentProgress {
  student: User;
  totalProblems: number;
  correctProblems: number;
  averageTime: number;
  masteryByCategory: {
    conceptId: string;
    conceptName: string;
    mastery: number;
  }[];
}
