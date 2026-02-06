'use client';

import ReactMarkdown from 'react-markdown';

export default function MarkdownViewer({ content }: { content: string }) {
  return (
    <article className="prose prose-slate max-w-none prose-headings:scroll-mt-20 prose-h1:text-4xl prose-h1:border-b prose-h1:pb-4 prose-h2:text-2xl prose-h2:mt-10 prose-h2:border-b prose-h2:pb-2 prose-h3:text-xl prose-h3:mt-8 prose-table:text-sm prose-th:bg-slate-100 prose-th:px-4 prose-th:py-2 prose-td:px-4 prose-td:py-2 prose-code:bg-slate-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-pre:bg-slate-900 prose-pre:text-slate-100 prose-blockquote:border-blue-300 prose-blockquote:bg-blue-50 prose-blockquote:py-1 prose-hr:my-8">
      <ReactMarkdown>{content}</ReactMarkdown>
    </article>
  );
}
