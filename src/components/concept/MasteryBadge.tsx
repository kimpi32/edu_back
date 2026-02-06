'use client';

import { cn } from '@/lib/utils';

interface MasteryBadgeProps {
  level: number; // 0.0 ~ 1.0
  size?: 'sm' | 'md' | 'lg';
}

export default function MasteryBadge({ level, size = 'md' }: MasteryBadgeProps) {
  const percent = Math.round(level * 100);

  const color = level >= 0.8
    ? 'text-green-600 bg-green-50 border-green-200'
    : level >= 0.5
      ? 'text-yellow-600 bg-yellow-50 border-yellow-200'
      : level >= 0.2
        ? 'text-orange-600 bg-orange-50 border-orange-200'
        : 'text-red-600 bg-red-50 border-red-200';

  const sizeClass = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5',
  }[size];

  return (
    <span className={cn('rounded border font-medium', color, sizeClass)}>
      {percent}%
    </span>
  );
}
