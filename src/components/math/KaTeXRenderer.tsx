'use client';

import katex from 'katex';
import { useMemo } from 'react';

interface KaTeXRendererProps {
  expression: string;
  displayMode?: boolean;
  className?: string;
}

export default function KaTeXRenderer({ expression, displayMode = true, className = '' }: KaTeXRendererProps) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(expression, {
        displayMode,
        throwOnError: false,
        trust: true,
      });
    } catch {
      return expression;
    }
  }, [expression, displayMode]);

  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
