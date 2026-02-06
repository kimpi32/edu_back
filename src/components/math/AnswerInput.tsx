'use client';

import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AnswerType } from '@/types';

interface AnswerInputProps {
  answerType: AnswerType;
  onSubmit: (answer: string) => void;
  disabled?: boolean;
}

export default function AnswerInput({ answerType, onSubmit, disabled = false }: AnswerInputProps) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onSubmit(value.trim());
      setValue('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-3">
      <Input
        ref={inputRef}
        type={answerType === 'number' ? 'text' : 'text'}
        inputMode={answerType === 'number' ? 'numeric' : 'text'}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={answerType === 'number' ? '숫자를 입력하세요' : '답을 입력하세요'}
        className="text-lg text-center max-w-xs"
        disabled={disabled}
        autoComplete="off"
      />
      <Button type="submit" disabled={disabled || !value.trim()}>
        제출
      </Button>
    </form>
  );
}
