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

export async function GET(
    request: Request,
    { params }: { params: Promise<{ exerciseId: string }> }
    ) {
    const authUser = verifyToken(request);
    const { exerciseId } = await params;

    if (!authUser || authUser.role !== 'CHILD') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const exercise = await prisma.exercise.findUnique({
            where: { id: exerciseId },
            include: {
                group: {
                    include: {
                        paths: {
                            where: { childId: authUser.userId }
                        }
                    }
                }
            }
        });

        if (!exercise) {
            return NextResponse.json({ error: 'Exercise not found' }, { status: 404 });
        }

        const studentPath = exercise.group.paths[0];

        if (!studentPath) {
            return NextResponse.json({ error: 'You do not have access to this course path' }, { status: 403 });
        }

        if (studentPath.status !== 'available' && studentPath.status !== 'completed') {
            return NextResponse.json({ error: 'This exercise group is not available' }, { status: 403 });
        }

        const successfulAttempts = await prisma.exerciseAttempt.findMany({
            where: {
                childId: authUser.userId,
                exercise: { groupId: exercise.groupId },
                success: true
            },
            distinct: ['exerciseId'],
            select: { exerciseId: true }
        });

        const completedCount = successfulAttempts.length;

        if (exercise.position > completedCount + 1) {
             return NextResponse.json({ 
                 error: `You must complete the previous exercises first.`
             }, { status: 403 });
        }

        return NextResponse.json({
            id: exercise.id,
            content_json: exercise.contentJson
        });

    } catch (error) {
        console.error('Error fetching exercise detail:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}