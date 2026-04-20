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
          orderBy: { createdAt: 'desc' }
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

    // Recuperiamo l'appuntamento di oggi per gestire il progresso in seduta
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const appointment = await prisma.appointment.findFirst({
        where: {
            childId: userId,
            startTime: { gte: startOfDay, lte: endOfDay }
        },
        include: { prescribedGroups: true }
    });

    const prescribedGroupIds = new Set(appointment?.prescribedGroups.map(g => g.id) || []);
    const isSessionActive = appointment?.trainingExercises! > 0 || prescribedGroupIds.size > 0;

    const completedExerciseIds = new Set(child.attempts.map(a => a.exerciseId));
    const todayCompletedExerciseIds = new Set(
        child.attempts
            .filter(a => a.createdAt >= startOfDay && a.createdAt <= endOfDay)
            .map(a => a.exerciseId)
    );

    const activeLevels: any[] = [];
    const allLevels = child.paths.map((path) => {
        const group = path.exerciseGroup;
        const isPrescribedToday = prescribedGroupIds.has(group.id);
        
        let status = path.status;
        let progress = 0;
        let activeExerciseId = group.exercises[0]?.id;

        if (status === 'completed') {
            progress = 2;
        }

        // Se è prescritto per oggi, forziamo la disponibilità e ricalcoliamo il progresso
        if (isPrescribedToday) {
            status = 'available';
            
            const completedInGroupToday = group.exercises.filter(ex => 
                todayCompletedExerciseIds.has(ex.id)
            ).length;
            
            progress = group.exercises.length > 0 ? completedInGroupToday / group.exercises.length : 0;
            // Se abbiamo finito tutto oggi, status torna completed per questo set
            if (completedInGroupToday === group.exercises.length) {
                status = 'completed';
            }
            
            const currentEx = group.exercises.find((e) => !todayCompletedExerciseIds.has(e.id));
            activeExerciseId = currentEx?.id || group.exercises[0]?.id;
        } else if (status === 'available') {
            const completedInGroupCount = group.exercises.filter(ex => 
                completedExerciseIds.has(ex.id)
            ).length;
            progress = group.exercises.length > 0 ? completedInGroupCount / group.exercises.length : 0;
            const currentEx = group.exercises.find((e) => !completedExerciseIds.has(e.id));
            activeExerciseId = currentEx?.id || group.exercises[0]?.id;
        }

        const levelData = {
            id: path.id,
            groupId: path.exerciseGroupId,
            status,
            group_title: group.title,
            group_topic: group.topic,
            progress: progress >= 1 ? 2 : (progress > 0 ? 1 : 0), // Normalizziamo a 0, 1, 2 per il ProgressRing
            activeExerciseId,
            firstExerciseId: group.exercises[0]?.id
        };

        if (status === 'available') {
            activeLevels.push(levelData);
        }

        return levelData;
    });

    return NextResponse.json({
      coins: child.coins,
      nr_completed: allLevels.filter(l => l.status === 'completed').length,
      nr_blocked: allLevels.filter(l => l.status === 'blocked').length,
      levels: activeLevels,
      all_levels: allLevels
    });

  } catch (error) {
    console.error('Error fetching student:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}