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
  { params }: { params: Promise<{ userId: string }> }
  
) {
  const authUser = verifyToken(request);
  const { userId } = await params;

  if (!authUser || authUser.role !== 'CHILD' || authUser.userId !== userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const child = await prisma.child.findUnique({
      where: { userId: userId },
      include: {
        user: true,
        attempts: {
          where: { success: true },
          select: { exerciseId: true } 
        },
        paths: {
          include: {
            exerciseGroup: {
              include: {
                exercises: {
                  orderBy: { position: 'asc' }
                }
              }
            }
          },
          orderBy: { position: 'asc' }
        }
      }
    });

    if (!child) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    let totalGroupsDone = 0;
    let totalGroupsBlocked = 0;
    const activeLevels: any[] = [];

    const completedExerciseIds = new Set(child.attempts.map(a => a.exerciseId));

    child.paths.forEach((path) => {
      if (path.status === 'completed') {
        totalGroupsDone++;
      } else if (path.status === 'blocked') {
        totalGroupsBlocked++;
      } else if (path.status === 'available') {
        const group = path.exerciseGroup;
        const total = group.exercises.length;

        const completedInGroupCount = group.exercises.filter(ex => 
            completedExerciseIds.has(ex.id)
        ).length;

        const progress = total > 0 ? completedInGroupCount / total : 0;
        
        const currentEx = group.exercises.find((e) => !completedExerciseIds.has(e.id));

        activeLevels.push({
          id: path.id,
          status: 'available',
          group_title: group.title,
          group_topic: group.topic,
          progress: progress > 0 ? 1 : 0,
          activeExerciseId: currentEx?.id,
          firstExerciseId: group.exercises[0]?.id
        });
      }
    });

    const allLevels = child.paths.map((path) => {
        const group = path.exerciseGroup;
        return {
            id: path.id,
            status: path.status,
            group_title: group.title,
            group_topic: group.topic,
            firstExerciseId: group.exercises[0]?.id
        };
    });

    return NextResponse.json({
      coins: child.coins,
      nr_completed: totalGroupsDone,
      nr_blocked: totalGroupsBlocked,
      levels: activeLevels,
      all_levels: allLevels
    });

  } catch (error) {
    console.error('Error fetching student:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}