import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: Request) {
  const authUser = getAuthUser(request);
  if (!authUser || authUser.role !== 'THERAPIST') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const students = await prisma.child.findMany({
      where: { therapistId: authUser.userId },
      include: { 
        user: true,
        appointments: {
          orderBy: { startTime: 'desc' },
          take: 1 // most recent only
        },
        _count: {
          select: { appointments: true }
        }
      }
    });

    const formatted = students.map(child => ({
      id: child.userId,
      name: child.user.name,
      surname: child.user.surname,
      age: child.age,
      gender: child.gender,
      diagnosis: child.description,
      totalSessions: child._count.appointments,
      lastSessionDate: child.appointments[0]?.startTime || null,
      initials: `${child.user.name[0]}${child.user.surname[0]}`.toUpperCase(),
      avatar: {
        skin_color: child.avatarSkinColor,
        hair_style: child.avatarHairStyle,
        hair_color: child.avatarHairColor,
        clothes: child.avatarClothes,
        eye: child.avatarEyes,
        mouth: child.avatarMouth,
      }
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authUser = getAuthUser(request);
  if (!authUser || authUser.role !== 'THERAPIST') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { 
      name, surname, username, password, 
      gender, age, ethnicity, description,
      skin_color, hair_style, hair_color, clothes, eye, mouth
    } = body;

    const hashedPassword = await bcrypt.hash(password, 10);
    const therapist = await prisma.therapist.findUniqueOrThrow({ where: { userId: authUser.userId } });

    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          username,
          password: hashedPassword,
          name,
          surname,
          role: 'CHILD',
          child: {
            create: {
              age: Number(age),
              gender, 
              ethnicity, 
              description,
              therapistId: therapist.userId,
              avatarSkinColor: skin_color,
              avatarHairStyle: hair_style,
              avatarHairColor: hair_color,
              avatarClothes: clothes,
              avatarEyes: eye,
              avatarMouth: mouth,
            }
          }
        },
        include: { child: true }
      });

      const allGroups = await tx.exerciseGroup.findMany({
        orderBy: { title: 'asc' }
      });

      if (allGroups.length > 0) {
        await Promise.all(allGroups.map((group, index) => {
          
          const initialStatus = index < 2 ? 'available' : 'blocked';

          return tx.path.create({
            data: {
              childId: newUser.child!.userId,
              exerciseGroupId: group.id,
              status: initialStatus,
              position: index + 1
            }
          });
        }));
      }

      return newUser;
    });

    return NextResponse.json({ 
      success: true, 
      student_id: result.id
    });

  } catch (error: any) {
    console.error('Create student error:', error);
    if (error.code === 'P2002') return NextResponse.json({ error: 'Username already exists' }, { status: 409 });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}