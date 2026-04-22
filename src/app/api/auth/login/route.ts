import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password, expectedRole } = body;

    if (!username || !password) {
      return NextResponse.json({ error: 'Missing username or password' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Validate role if expectedRole is provided
    if (expectedRole && user.role !== expectedRole) {
      const roleLabel = expectedRole === 'THERAPIST' ? 'un logopedista' : 'un ragazzo';
      return NextResponse.json(
        { error: `Queste credenziali non appartengono a ${roleLabel}` },
        { status: 403 }
      );
    }

    if (!JWT_SECRET) {
      console.error("JWT_SECRET is missing");
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
      },
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}