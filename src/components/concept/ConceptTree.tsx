'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ConceptTreeNode } from '@/types';

interface ConceptTreeProps {
  nodes: ConceptTreeNode[];
  onSelect?: (concept: ConceptTreeNode) => void;
  selectedId?: string;
  showMastery?: boolean;
}

function getMasteryColor(mastery?: number) {
  if (mastery === undefined) return 'bg-gray-200';
  if (mastery >= 0.8) return 'bg-green-500';
  if (mastery >= 0.5) return 'bg-yellow-500';
  if (mastery >= 0.2) return 'bg-orange-500';
  return 'bg-red-500';
}

function getLevelBadge(level: string) {
  switch (level) {
    case 'large': return { label: '대', variant: 'default' as const };
    case 'medium': return { label: '중', variant: 'secondary' as const };
    case 'small': return { label: '소', variant: 'outline' as const };
    default: return { label: level, variant: 'outline' as const };
  }
}

function TreeNode({
  node,
  onSelect,
  selectedId,
  showMastery,
  depth = 0,
}: {
  node: ConceptTreeNode;
  onSelect?: (concept: ConceptTreeNode) => void;
  selectedId?: string;
  showMastery?: boolean;
  depth?: number;
}) {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = node.children && node.children.length > 0;
  const badge = getLevelBadge(node.level);

  return (
    <div className="select-none">
      <div
        className={cn(
          'flex items-center gap-2 py-1.5 px-2 rounded cursor-pointer hover:bg-muted',
          selectedId === node.id && 'bg-primary/10 ring-1 ring-primary',
        )}
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
        onClick={() => {
          if (hasChildren) setExpanded(!expanded);
          onSelect?.(node);
        }}
      >
        {hasChildren && (
          <span className="text-xs text-muted-foreground w-4">
            {expanded ? '▼' : '▶'}
          </span>
        )}
        {!hasChildren && <span className="w-4" />}
        <Badge variant={badge.variant} className="text-xs px-1.5">
          {badge.label}
        </Badge>
        <span className="text-sm flex-1">{node.name}</span>
        {showMastery && node.mastery !== undefined && (
          <div className="flex items-center gap-2">
            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full', getMasteryColor(node.mastery))}
                style={{ width: `${node.mastery * 100}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground w-10 text-right">
              {Math.round(node.mastery * 100)}%
            </span>
          </div>
        )}
      </div>
      {expanded && hasChildren && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              onSelect={onSelect}
              selectedId={selectedId}
              showMastery={showMastery}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ConceptTree({ nodes, onSelect, selectedId, showMastery }: ConceptTreeProps) {
  return (
    <div className="space-y-1">
      {nodes.map((node) => (
        <TreeNode
          key={node.id}
          node={node}
          onSelect={onSelect}
          selectedId={selectedId}
          showMastery={showMastery}
        />
      ))}
    </div>
  );
}
