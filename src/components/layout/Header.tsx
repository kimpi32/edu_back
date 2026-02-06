'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { getTestUser, testLogout } from '@/lib/test-auth';
import { User } from '@/types';
import { useEffect, useState } from 'react';

export default function Header() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    async function getUser() {
      // 1. 테스트 유저 확인
      const testUser = getTestUser();
      if (testUser) {
        setUser(testUser);
        return;
      }

      // 2. Supabase 유저 확인
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          const { data } = await supabase
            .from('users')
            .select('*')
            .eq('id', authUser.id)
            .single();
          setUser(data);
        }
      } catch {
        // Supabase not configured
      }
    }
    getUser();
  }, []);

  const handleLogout = async () => {
    // 테스트 유저 로그아웃
    const testUser = getTestUser();
    if (testUser) {
      testLogout();
      router.push('/login');
      router.refresh();
      return;
    }

    // Supabase 로그아웃
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="border-b bg-white">
      <div className="flex h-14 items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-primary">MathLMS</span>
        </Link>

        <nav className="flex items-center gap-4">
          {user ? (
            <>
              {(user.role === 'teacher' || user.role === 'admin') && (
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm">대시보드</Button>
                </Link>
              )}
              {user.role === 'student' && (
                <Link href="/learn">
                  <Button variant="ghost" size="sm">학습</Button>
                </Link>
              )}
              {user.role === 'admin' && (
                <Link href="/admin/concepts">
                  <Button variant="ghost" size="sm">관리</Button>
                </Link>
              )}
              <span className="text-sm text-muted-foreground">{user.name}</span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                로그아웃
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">로그인</Button>
              </Link>
              <Link href="/signup">
                <Button size="sm">회원가입</Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
