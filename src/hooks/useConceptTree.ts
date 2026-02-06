'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Concept, ConceptTreeNode, ConceptMastery } from '@/types';

function buildTree(concepts: Concept[], masteryMap: Map<string, number>): ConceptTreeNode[] {
  const nodeMap = new Map<string, ConceptTreeNode>();

  // Create nodes
  concepts.forEach(c => {
    nodeMap.set(c.id, {
      ...c,
      children: [],
      mastery: masteryMap.get(c.id),
    });
  });

  // Build tree
  const roots: ConceptTreeNode[] = [];
  concepts.forEach(c => {
    const node = nodeMap.get(c.id)!;
    if (c.parent_id && nodeMap.has(c.parent_id)) {
      nodeMap.get(c.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  // Sort children by sort_order
  function sortChildren(nodes: ConceptTreeNode[]) {
    nodes.sort((a, b) => a.sort_order - b.sort_order);
    nodes.forEach(n => sortChildren(n.children));
  }
  sortChildren(roots);

  return roots;
}

export function useConceptTree(studentId?: string) {
  const [tree, setTree] = useState<ConceptTreeNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();

      const { data: concepts } = await supabase
        .from('concepts')
        .select('*')
        .order('sort_order', { ascending: true });

      const masteryMap = new Map<string, number>();
      if (studentId) {
        const { data: mastery } = await supabase
          .from('concept_mastery')
          .select('*')
          .eq('student_id', studentId);

        mastery?.forEach((m: ConceptMastery) => {
          masteryMap.set(m.concept_id, m.mastery_level);
        });
      }

      setTree(buildTree(concepts ?? [], masteryMap));
      setLoading(false);
    }

    load();
  }, [studentId]);

  return { tree, loading };
}
