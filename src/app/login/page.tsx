'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { createClient } from '@/lib/supabase/client';
import { testLogin } from '@/lib/test-auth';
import { UserRole } from '@/types';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError('이메일 또는 비밀번호가 올바르지 않습니다.');
        setLoading(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profile?.role === 'student') {
          router.push('/learn');
        } else {
          router.push('/dashboard');
        }
        router.refresh();
      }
    } catch {
      setError('로그인에 실패했습니다.');
      setLoading(false);
    }
  };

  const handleTestLogin = (role: UserRole) => {
    const user = testLogin(role);
    if (role === 'student') {
      router.push('/learn');
    } else {
      router.push('/dashboard');
    }
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">로그인</CardTitle>
          <p className="text-sm text-muted-foreground">MathLMS에 로그인하세요</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 테스트 로그인 */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-center text-muted-foreground">테스트 로그인</p>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                onClick={() => handleTestLogin('teacher')}
                className="flex flex-col h-auto py-3"
              >
                <span className="text-lg">👨‍🏫</span>
                <span className="text-xs">교사</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => handleTestLogin('student')}
                className="flex flex-col h-auto py-3"
              >
                <span className="text-lg">👨‍🎓</span>
                <span className="text-xs">학생</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => handleTestLogin('admin')}
                className="flex flex-col h-auto py-3"
              >
                <span className="text-lg">⚙️</span>
                <span className="text-xs">관리자</span>
              </Button>
            </div>
          </div>

          <div className="relative">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
              또는
            </span>
          </div>

          {/* 실제 로그인 폼 */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                required
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '로그인 중...' : '로그인'}
            </Button>
          </form>
          <div className="text-center text-sm text-muted-foreground">
            계정이 없으신가요?{' '}
            <Link href="/signup" className="text-primary underline">
              회원가입
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
