-- ============================================
-- 개념 선수학습 관계 (Concept Prerequisites DAG)
-- ============================================

CREATE TABLE concept_prerequisites (
  concept_id UUID NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
  prerequisite_id UUID NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
  strength TEXT NOT NULL DEFAULT 'required' CHECK (strength IN ('required', 'recommended')),
  PRIMARY KEY (concept_id, prerequisite_id),
  CHECK (concept_id != prerequisite_id)
);

CREATE INDEX idx_prereq_concept ON concept_prerequisites(concept_id);
CREATE INDEX idx_prereq_prerequisite ON concept_prerequisites(prerequisite_id);

COMMENT ON TABLE concept_prerequisites IS '소개념 간 선수학습 관계 DAG. A를 배우려면 B를 먼저 알아야 한다.';
COMMENT ON COLUMN concept_prerequisites.strength IS 'required: 필수 선수, recommended: 권장 선수';
