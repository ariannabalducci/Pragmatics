import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const groups = await prisma.exerciseGroup.findMany({
      orderBy: { title: 'asc' }
    });
    
    // Mappatura per il frontend che si aspetta 'displayName' e 'fileName' 
    // (legacy dalla struttura basata su file, ora usiamo il DB)
    const formatted = groups.map(g => ({
      id: g.id,
      displayName: g.title,
      fileName: g.id, // Usiamo l'ID come riferimento univoco
      topic: g.topic
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Error fetching exercises:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
