import DashboardLayout from '@/components/layout/DashboardLayout';

export default function TeacherDashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout variant="teacher">{children}</DashboardLayout>;
}
