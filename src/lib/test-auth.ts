import { User, UserRole } from '@/types';

const TEST_USERS: Record<string, User> = {
  teacher: {
    id: 'test-teacher-001',
    email: 'teacher@test.com',
    role: 'teacher',
    name: '김선생',
    created_at: new Date().toISOString(),
  },
  student: {
    id: 'test-student-001',
    email: 'student@test.com',
    role: 'student',
    name: '박학생',
    created_at: new Date().toISOString(),
  },
  admin: {
    id: 'test-admin-001',
    email: 'admin@test.com',
    role: 'admin',
    name: '관리자',
    created_at: new Date().toISOString(),
  },
};

export function testLogin(role: UserRole) {
  const user = TEST_USERS[role];
  document.cookie = `test-user=${JSON.stringify(user)}; path=/; max-age=86400`;
  return user;
}

export function testLogout() {
  document.cookie = 'test-user=; path=/; max-age=0';
}

export function getTestUser(): User | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/test-user=([^;]+)/);
  if (!match) return null;
  try {
    return JSON.parse(decodeURIComponent(match[1]));
  } catch {
    return null;
  }
}
