import { NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma/client"; 

const prisma = new PrismaClient();

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> } // Definiamo params come Promise
) {
  try {
    // 1. Estraiamo l'ID aspettando la promessa dei parametri
    const { id } = await params; 

    // Debug opzionale per vedere se l'ID arriva davvero
    console.log("Tentativo eliminazione ID:", id);

    if (!id) {
      return NextResponse.json({ error: "ID mancante" }, { status: 400 });
    }

    // 2. Eseguiamo l'eliminazione
    await prisma.appointment.delete({
      where: { id: id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Errore Prisma DELETE:", error);
    return NextResponse.json(
      { error: "Errore durante la cancellazione o ID non trovato" }, 
      { status: 500 }
    );
  }
}