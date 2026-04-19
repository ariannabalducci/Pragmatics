import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

const SECRET_KEY = process.env.JWT_SECRET || "";

export async function POST(request: Request) {
  try {
    // 1. Verifica Autorizzazione
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !SECRET_KEY) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const token = authHeader.split(' ')[1];
    const authUser = jwt.verify(token, SECRET_KEY) as { userId: string, role: string };

    if (authUser.role !== 'THERAPIST') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // 2. Lettura Dati dal Body
    const { fileName, childId, title } = await request.json();

    // 3. Lettura File JSON fisico
    const filePath = path.join(process.cwd(), 'exercises', fileName);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const exerciseData = JSON.parse(fileContent);

    // 4. Transazione Database
    const result = await prisma.$transaction(async (tx) => {
      
      // Creazione del Gruppo Esercizi
      const group = await tx.exerciseGroup.create({
        data: {
          title: title,
          topic: "Generale",
          exercises: {
            create: [{
              contentJson: exerciseData,
              position: 1,
              // FISSATO: Nello schema hai enum ExerciseType { story, chat }
              // Impostiamo 'story' come default o puoi dedurlo dal JSON
              exerciseType: 'story' 
            }]
          }
        }
      });

      // Calcolo Posizione nel percorso del bambino
      const lastPath = await tx.path.findFirst({
        where: { childId: childId },
        orderBy: { position: 'desc' }
      });
      const nextPosition = (lastPath?.position ?? 0) + 1;

      // Creazione del legame nel percorso (Path)
      return await tx.path.create({
        data: {
          childId: childId,
          exerciseGroupId: group.id,
          // FISSATO: Enum ExerciseGroupStatus { available, blocked, completed }
          status: 'available', 
          position: nextPosition
        }
      });
    });

    return NextResponse.json({ success: true, pathId: result.id });

  } catch (error: any) {
    console.error("ERRORE API:", error);
    return NextResponse.json({ error: 'Internal Error', details: error.message }, { status: 500 });
  }
}