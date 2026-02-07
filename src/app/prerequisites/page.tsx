import fs from 'fs';
import path from 'path';
import MarkdownViewer from '../features/MarkdownViewer';

export default function PrerequisitesPage() {
  const filePath = path.join(process.cwd(), 'PREREQUISITES.md');
  const content = fs.readFileSync(filePath, 'utf-8');

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <MarkdownViewer content={content} />
      </div>
    </div>
  );
}
