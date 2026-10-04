import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, isTherapistOf } from '@/lib/auth';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ studentId: string }> }
) {
  const { studentId } = await params;
  const authUser = getAuthUser(request);
  if (!authUser || authUser.role !== 'THERAPIST') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    if (!(await isTherapistOf(authUser.userId, studentId))) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    const { feedback } = await request.json();

    const newFeedback = await prisma.feedback.create({
        data: {
            content: feedback,
            therapistId: authUser.userId,
            childId: studentId
        }
    });

    return NextResponse.json({
        date: newFeedback.createdAt,
        feedback: newFeedback.content
    });

  } catch (error) {
    console.error('Add feedback error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}