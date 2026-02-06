'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import MasteryBadge from '@/components/concept/MasteryBadge';
import { createClient } from '@/lib/supabase/client';
import { Class, User } from '@/types';

export default function ClassDetailPage() {
  const params = useParams();
  const classId = params.id as string;
  const supabase = createClient();

  const [classData, setClassData] = useState<Class | null>(null);
  const [students, setStudents] = useState<User[]>([]);
  const [studentMastery, setStudentMastery] = useState<Record<string, number>>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [studentEmail, setStudentEmail] = useState('');
  const [addError, setAddError] = useState('');

  const loadData = async () => {
    // Load class
    const { data: cls } = await supabase
      .from('classes')
      .select('*')
      .eq('id', classId)
      .single();
    setClassData(cls);

    // Load students
    const { data: csData } = await supabase
      .from('class_students')
      .select('*, student:users(*)')
      .eq('class_id', classId);

    const studs = csData?.map((cs: { student: User }) => cs.student) ?? [];
    setStudents(studs);

    // Load average mastery per student
    const masteryMap: Record<string, number> = {};
    for (const s of studs) {
      const { data: mastery } = await supabase
        .from('concept_mastery')
        .select('mastery_level')
        .eq('student_id', s.id);

      if (mastery && mastery.length > 0) {
        const avg = mastery.reduce((sum: number, m: { mastery_level: number }) => sum + m.mastery_level, 0) / mastery.length;
        masteryMap[s.id] = avg;
      }
    }
    setStudentMastery(masteryMap);
  };

  useEffect(() => { loadData(); }, [classId]);

  const handleAddStudent = async () => {
    setAddError('');

    // Find user by email
    const { data: student } = await supabase
      .from('users')
      .select('*')
      .eq('email', studentEmail.trim())
      .eq('role', 'student')
      .single();

    if (!student) {
      setAddError('해당 이메일의 학생을 찾을 수 없습니다.');
      return;
    }

    // Check if already enrolled
    const { data: existing } = await supabase
      .from('class_students')
      .select('*')
      .eq('class_id', classId)
      .eq('student_id', student.id)
      .single();

    if (existing) {
      setAddError('이미 등록된 학생입니다.');
      return;
    }

    await supabase.from('class_students').insert({
      class_id: classId,
      student_id: student.id,
    });

    setStudentEmail('');
    setDialogOpen(false);
    loadData();
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (!confirm('학생을 반에서 제거하시겠습니까?')) return;
    await supabase.from('class_students').delete()
      .eq('class_id', classId)
      .eq('student_id', studentId);
    loadData();
  };

  if (!classData) return <div>로딩 중...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{classData.name}</h1>
          <p className="text-muted-foreground">학생 {students.length}명</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>+ 학생 추가</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>학생 추가</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>학생 이메일</Label>
                <Input
                  value={studentEmail}
                  onChange={e => setStudentEmail(e.target.value)}
                  placeholder="student@example.com"
                  type="email"
                />
              </div>
              {addError && <p className="text-sm text-destructive">{addError}</p>}
              <Button onClick={handleAddStudent} className="w-full">추가</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>학생 목록</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>이름</TableHead>
                <TableHead>이메일</TableHead>
                <TableHead>평균 마스터리</TableHead>
                <TableHead>작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map(s => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{s.email}</TableCell>
                  <TableCell>
                    {studentMastery[s.id] !== undefined ? (
                      <MasteryBadge level={studentMastery[s.id]} size="sm" />
                    ) : (
                      <span className="text-muted-foreground text-sm">미측정</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="destructive" onClick={() => handleRemoveStudent(s.id)}>
                      제거
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {students.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    등록된 학생이 없습니다.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
