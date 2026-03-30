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
  { params }: { params: Promise<{ studentId: string }> }
) {
  const { studentId } = await params;
  const authUser = verifyToken(request);
  if (!authUser || authUser.role !== 'THERAPIST') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const child = await prisma.child.findUnique({
      where: { userId: studentId },
      include: {
        user: true,
        feedbacks: {
            orderBy: { createdAt: 'desc' }
        },
        attempts: {
          where: { success: true },
          include: { 
            exercise: {
                include: {
                    group: true 
                }
            } 
          }
        }
      }
    });

    if (!child) {
        return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const statsMap: Record<string, number> = {};
    
    child.attempts.forEach(attempt => {
        const topic = attempt.exercise.group.topic; 
        
        if (statsMap[topic]) {
            statsMap[topic]++;
        } else {
            statsMap[topic] = 1;
        }
    });

    const response = {
      name: child.user.name,
      surname: child.user.surname,
      username: child.user.username,
      gender: child.gender,
      age: child.age,
      ethnicity: child.ethnicity,
      description: child.description,
      stats: statsMap,
      feedbacks: child.feedbacks.map(f => ({
          id: f.id,
          date: f.createdAt,
          content: f.content
      })),
      avatar: {
        skin_color: child.avatarSkinColor,
        hair_style: child.avatarHairStyle,
        hair_color: child.avatarHairColor,
        clothes: child.avatarClothes,
        eye: child.avatarEyes,
        mouth: child.avatarMouth,
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Get student details error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ studentId: string }> }
) {
  const { studentId } = await params;
  const authUser = verifyToken(request);

  if (!authUser || authUser.role !== 'THERAPIST') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { 
      name, surname,
      gender, age, ethnicity, description,
      skin_color, hair_style, hair_color, clothes, eye, mouth
    } = body;

    const updatedUser = await prisma.$transaction(async (tx) => {
      
      const user = await tx.user.update({
        where: { id: studentId },
        data: {
          name: name,
          surname: surname
        }
      });

      const child = await tx.child.update({
        where: { userId: studentId },
        data: {
          age: Number(age),
          gender: gender,
          ethnicity: ethnicity,
          description: description,
          avatarSkinColor: skin_color,
          avatarHairStyle: hair_style,
          avatarHairColor: hair_color,
          avatarClothes: clothes,
          avatarEyes: eye,
          avatarMouth: mouth
        }
      });

      return { user, child };
    });

    return NextResponse.json({ 
      success: true, 
      student_id: updatedUser.user.id,
      message: "Student profile updated successfully" 
    });

  } catch (error) {
    console.error('Update student error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}