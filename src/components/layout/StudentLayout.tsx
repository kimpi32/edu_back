'use client';

import Header from './Header';
import Sidebar from './Sidebar';

const studentSidebarItems = [
  { label: '학습', href: '/learn' },
  { label: '오답 복습', href: '/learn/review' },
  { label: '내 진도', href: '/progress' },
];

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar items={studentSidebarItems} />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
