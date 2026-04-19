import { NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma/client"; 

const prisma = new PrismaClient();

// Nota: aggiungiamo Promise a params per Next.js 15
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> } 
) {
  try {
    // DEVI aspettare che i parametri vengano risolti
    const resolvedParams = await params;
    const appointmentId = resolvedParams.id;

    if (!appointmentId) {
      return NextResponse.json({ error: "ID non trovato" }, { status: 400 });
    }

    await prisma.appointment.delete({
      where: { id: appointmentId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Errore API Delete:", error);
    return NextResponse.json({ error: "Errore durante la cancellazione" }, { status: 500 });
  }
}