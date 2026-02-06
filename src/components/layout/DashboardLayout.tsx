'use client';

import Header from './Header';
import Sidebar from './Sidebar';

const teacherSidebarItems = [
  { label: '대시보드', href: '/dashboard' },
  { label: '반 관리', href: '/dashboard/classes' },
  { label: '개념 트리', href: '/dashboard/concepts' },
  { label: '시퀀스', href: '/dashboard/sequences' },
  { label: '배정하기', href: '/dashboard/assign' },
  { label: '분석', href: '/dashboard/analytics' },
];

const adminSidebarItems = [
  { label: '개념 관리', href: '/admin/concepts' },
  { label: '문제 관리', href: '/admin/problems' },
  { label: '시퀀스 관리', href: '/admin/sequences' },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
  variant?: 'teacher' | 'admin';
}

export default function DashboardLayout({ children, variant = 'teacher' }: DashboardLayoutProps) {
  const items = variant === 'admin' ? adminSidebarItems : teacherSidebarItems;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar items={items} />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
