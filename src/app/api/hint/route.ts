import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { expression, previousAttempts, hint } = await req.json();

    // 문제 자체 힌트가 있으면 먼저 반환
    if (hint && previousAttempts.length === 0) {
      return NextResponse.json({ hint });
    }

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 200,
      system: `당신은 수학 튜터입니다. 학생에게 최소한의 힌트만 제공합니다.
규칙:
- 정답을 절대 직접 알려주지 마세요
- 한두 문장으로만 답하세요
- 풀이 방향만 제시하세요
- 한국어로 답하세요`,
      messages: [
        {
          role: 'user',
          content: `문제: ${expression}
${previousAttempts.length > 0 ? `학생의 이전 시도: ${previousAttempts.join(', ')}` : ''}
이 문제에 대한 최소한의 힌트를 주세요.`,
        },
      ],
    });

    const hintText = message.content[0].type === 'text'
      ? message.content[0].text
      : '힌트를 생성할 수 없습니다.';

    return NextResponse.json({ hint: hintText });
  } catch (error) {
    console.error('Hint generation error:', error);
    return NextResponse.json(
      { error: '힌트를 생성할 수 없습니다.' },
      { status: 500 }
    );
  }
}
