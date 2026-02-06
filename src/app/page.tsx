import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="flex h-14 items-center justify-between px-6 max-w-6xl mx-auto">
          <span className="text-xl font-bold">MathLMS</span>
          <div className="flex gap-3">
            <Link href="/login">
              <Button variant="ghost">로그인</Button>
            </Link>
            <Link href="/signup">
              <Button>회원가입</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="py-24 px-6">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h1 className="text-5xl font-bold tracking-tight">
              문제가 곧 선생님
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              설명 없이, 순수 수식 문제의 시퀀스만으로 수학 개념을 체득합니다.
              정교하게 배치된 문제를 풀다 보면 패턴을 스스로 발견하게 됩니다.
            </p>
            <div className="flex gap-4 justify-center pt-4">
              <Link href="/signup">
                <Button size="lg">시작하기</Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline">로그인</Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Example sequence */}
        <section className="py-16 px-6 bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8">이런 식으로 배웁니다</h2>
            <Card className="max-w-md mx-auto">
              <CardContent className="py-8 space-y-4">
                <div className="text-center text-lg font-mono space-y-2">
                  <p className="text-green-600">9 x 11 = 99 ✓</p>
                  <p className="text-green-600">9 x 111 = 999 ✓</p>
                  <p className="text-green-600">9 x 1111 = 9999 ✓</p>
                  <p className="text-muted-foreground">9 x 11111 = ?</p>
                </div>
                <p className="text-center text-sm text-muted-foreground pt-4">
                  패턴을 발견하셨나요? 이것이 인수분해의 시작입니다.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8">핵심 기능</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="pt-6 space-y-2">
                  <h3 className="font-bold text-lg">개념 분해 트리</h3>
                  <p className="text-sm text-muted-foreground">
                    초등~고등 수학을 소개념-중개념-대개념으로 체계적으로 분해합니다.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 space-y-2">
                  <h3 className="font-bold text-lg">문제 시퀀스</h3>
                  <p className="text-sm text-muted-foreground">
                    정교하게 배치된 문제를 순서대로 풀며 개념을 자연스럽게 습득합니다.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 space-y-2">
                  <h3 className="font-bold text-lg">AI 힌트</h3>
                  <p className="text-sm text-muted-foreground">
                    막힐 때 최소한의 힌트만 제공하여 스스로 풀어나갈 수 있도록 돕습니다.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Role description */}
        <section className="py-16 px-6 bg-muted/30">
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardContent className="pt-6 space-y-3">
                <h3 className="font-bold text-xl">교사</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>- 개념 트리와 문제를 관리합니다</li>
                  <li>- 문제 시퀀스를 설계하고 배치합니다</li>
                  <li>- 반을 만들고 학생에게 시퀀스를 배정합니다</li>
                  <li>- 학생의 진도와 개념 습득도를 분석합니다</li>
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 space-y-3">
                <h3 className="font-bold text-xl">학생</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>- 배정된 문제 시퀀스를 순서대로 풉니다</li>
                  <li>- 이전 문제의 히스토리를 보며 패턴을 발견합니다</li>
                  <li>- AI 힌트로 막힌 부분을 해결합니다</li>
                  <li>- 오답 복습과 개념별 마스터리를 확인합니다</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        수학 개념 분해 LMS - 문제 시퀀스 기반 학습
      </footer>
    </div>
  );
}
