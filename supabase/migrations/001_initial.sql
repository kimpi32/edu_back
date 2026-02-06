-- ============================================
-- 수학 개념 분해 기반 LMS - Initial Schema
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Custom Types
-- ============================================

CREATE TYPE concept_level AS ENUM ('small', 'medium', 'large');
CREATE TYPE answer_type AS ENUM ('number', 'expression', 'select');
CREATE TYPE user_role AS ENUM ('teacher', 'student', 'admin');

-- ============================================
-- Users (extends Supabase Auth)
-- ============================================

CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'student',
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 개념 트리 (Concept Tree)
-- ============================================

CREATE TABLE concepts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  level concept_level NOT NULL,
  parent_id UUID REFERENCES concepts(id) ON DELETE SET NULL,
  grade_range INT[] DEFAULT '{}',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_concepts_parent ON concepts(parent_id);
CREATE INDEX idx_concepts_level ON concepts(level);

-- ============================================
-- 문제 (Problems)
-- ============================================

CREATE TABLE problems (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expression TEXT NOT NULL,
  answer TEXT NOT NULL,
  answer_type answer_type NOT NULL DEFAULT 'number',
  difficulty INT NOT NULL DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 5),
  hint TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 문제 ↔ 개념 (Many-to-Many)
-- ============================================

CREATE TABLE problem_concepts (
  problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  concept_id UUID NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  PRIMARY KEY (problem_id, concept_id)
);

CREATE INDEX idx_problem_concepts_concept ON problem_concepts(concept_id);

-- ============================================
-- 문제 시퀀스 (Sequences)
-- ============================================

CREATE TABLE sequences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE sequence_problems (
  sequence_id UUID NOT NULL REFERENCES sequences(id) ON DELETE CASCADE,
  problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  position INT NOT NULL,
  PRIMARY KEY (sequence_id, problem_id),
  UNIQUE (sequence_id, position)
);

-- ============================================
-- 반 (Classes)
-- ============================================

CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_classes_teacher ON classes(teacher_id);

CREATE TABLE class_students (
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (class_id, student_id)
);

CREATE INDEX idx_class_students_student ON class_students(student_id);

-- ============================================
-- 배정 (Assignments)
-- ============================================

CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  sequence_id UUID NOT NULL REFERENCES sequences(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_assignments_class ON assignments(class_id);
CREATE INDEX idx_assignments_sequence ON assignments(sequence_id);

-- ============================================
-- 학생 풀이 기록 (Submissions)
-- ============================================

CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  time_spent_sec INT,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_submissions_student ON submissions(student_id);
CREATE INDEX idx_submissions_assignment ON submissions(assignment_id);
CREATE INDEX idx_submissions_problem ON submissions(problem_id);

-- ============================================
-- 개념 마스터리 (Concept Mastery)
-- ============================================

CREATE TABLE concept_mastery (
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  concept_id UUID NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
  mastery_level FLOAT NOT NULL DEFAULT 0.0 CHECK (mastery_level BETWEEN 0.0 AND 1.0),
  problems_attempted INT NOT NULL DEFAULT 0,
  problems_correct INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (student_id, concept_id)
);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE concepts ENABLE ROW LEVEL SECURITY;
ALTER TABLE problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE problem_concepts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE sequence_problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE concept_mastery ENABLE ROW LEVEL SECURITY;

-- Users: can read own profile, admins can read all
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all users"
  ON users FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Teachers can view students in their classes"
  ON users FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM class_students cs
      JOIN classes c ON cs.class_id = c.id
      WHERE cs.student_id = users.id AND c.teacher_id = auth.uid()
    )
  );

-- Concepts: readable by all authenticated users
CREATE POLICY "Concepts are readable by all authenticated"
  ON concepts FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins and teachers can manage concepts"
  ON concepts FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
  );

-- Problems: readable by all authenticated users
CREATE POLICY "Problems are readable by all authenticated"
  ON problems FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins and teachers can manage problems"
  ON problems FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
  );

-- Problem Concepts: readable by all authenticated
CREATE POLICY "Problem concepts are readable by all authenticated"
  ON problem_concepts FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins and teachers can manage problem concepts"
  ON problem_concepts FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
  );

-- Sequences: readable by all authenticated
CREATE POLICY "Sequences are readable by all authenticated"
  ON sequences FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins and teachers can manage sequences"
  ON sequences FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
  );

-- Sequence Problems
CREATE POLICY "Sequence problems are readable by all authenticated"
  ON sequence_problems FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins and teachers can manage sequence problems"
  ON sequence_problems FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
  );

-- Classes: teachers see own, students see enrolled
CREATE POLICY "Teachers can manage own classes"
  ON classes FOR ALL USING (teacher_id = auth.uid());

CREATE POLICY "Students can view enrolled classes"
  ON classes FOR SELECT USING (
    EXISTS (SELECT 1 FROM class_students WHERE class_id = classes.id AND student_id = auth.uid())
  );

-- Class Students
CREATE POLICY "Teachers can manage class students"
  ON class_students FOR ALL USING (
    EXISTS (SELECT 1 FROM classes WHERE id = class_students.class_id AND teacher_id = auth.uid())
  );

CREATE POLICY "Students can view own enrollment"
  ON class_students FOR SELECT USING (student_id = auth.uid());

-- Assignments
CREATE POLICY "Teachers can manage assignments for own classes"
  ON assignments FOR ALL USING (
    EXISTS (SELECT 1 FROM classes WHERE id = assignments.class_id AND teacher_id = auth.uid())
  );

CREATE POLICY "Students can view assignments for enrolled classes"
  ON assignments FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM class_students
      WHERE class_id = assignments.class_id AND student_id = auth.uid()
    )
  );

-- Submissions
CREATE POLICY "Students can create own submissions"
  ON submissions FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can view own submissions"
  ON submissions FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Teachers can view submissions for own classes"
  ON submissions FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM assignments a
      JOIN classes c ON a.class_id = c.id
      WHERE a.id = submissions.assignment_id AND c.teacher_id = auth.uid()
    )
  );

-- Concept Mastery
CREATE POLICY "Students can view own mastery"
  ON concept_mastery FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Students can upsert own mastery"
  ON concept_mastery FOR ALL USING (student_id = auth.uid());

CREATE POLICY "Teachers can view mastery for own class students"
  ON concept_mastery FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM class_students cs
      JOIN classes c ON cs.class_id = c.id
      WHERE cs.student_id = concept_mastery.student_id AND c.teacher_id = auth.uid()
    )
  );

-- ============================================
-- Helper function for user creation trigger
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, role, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')::user_role,
    COALESCE(NEW.raw_user_meta_data->>'name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
