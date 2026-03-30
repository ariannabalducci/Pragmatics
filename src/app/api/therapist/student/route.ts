import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

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

export async function GET(request: Request) {
  const authUser = verifyToken(request);
  if (!authUser || authUser.role !== 'THERAPIST') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const therapist = await prisma.therapist.findUnique({
      where: { userId: authUser.userId }
    });

    if (!therapist) return NextResponse.json({ error: 'Therapist profile not found' }, { status: 404 });

    const students = await prisma.child.findMany({
      where: { therapistId: therapist.userId },
      include: { user: true }
    });

    const formatted = students.map(child => ({
      id: child.userId,
      name: child.user.name + ' ' + child.user.surname,
      age: child.age,
      gender: child.gender,
      description: child.description,
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
    console.error('List students error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authUser = verifyToken(request);
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