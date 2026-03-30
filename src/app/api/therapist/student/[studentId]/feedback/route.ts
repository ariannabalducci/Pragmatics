import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET;

const verifyToken = (req: Request) => {
  if (!SECRET_KEY) throw new Error('JWT_SECRET not defined');
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return null;
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, SECRET_KEY);
    return decoded as { userId: string; role: string };
  } catch {
    return null;
  }
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ studentId: string }> }
) {
  const { studentId } = await params;
  const authUser = verifyToken(request);
  if (!authUser || authUser.role !== 'THERAPIST') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { feedback } = await request.json();

    const therapist = await prisma.therapist.findUniqueOrThrow({
        where: { userId: authUser.userId }
    });

    const child = await prisma.child.findUniqueOrThrow({
        where: { userId: studentId }
    });

    const newFeedback = await prisma.feedback.create({
        data: {
            content: feedback,
            therapistId: therapist.userId,
            childId: child.userId
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