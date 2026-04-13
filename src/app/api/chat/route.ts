import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { chattogemini } from '@/utils/geminiHelpers';
import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET;

export async function POST(request: Request) {
  try {
    // LOG 1: Ricezione richiesta
    console.log("--- CHAT DEBUG START ---");

    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    
    if (!token || !SECRET_KEY) {
        console.error("Token o Secret Key mancante");
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { message, history, exerciseId } = body;
    console.log("Body ricevuto:", { message, exerciseId });

    // LOG 2: Verifica Prisma
    const exercise = await prisma.exercise.findUnique({
      where: { id: exerciseId },
      include: { group: true }
    });

    if (!exercise) {
      console.error("ERRORE: Esercizio non trovato nel DB per ID:", exerciseId);
      return NextResponse.json({ 
        response: "Squawk! Non trovo questo esercizio nel mio database. Prova a ricaricare la mappa!", 
        is_ended: false 
      }, { status: 200 });
    }

    const systemPrompt = `Tu sei Praggy, un pappagallo. Rispondi in italiano. Breve. No grassetto. JSON format: {"message": "string", "is_ended": boolean}`;

    // LOG 3: Chiamata Gemini
    console.log("Chiamata a Gemini in corso...");
    let aiResponse;
    try {
        aiResponse = await chattogemini(message, history || [], systemPrompt);
        console.log("Risposta Gemini ricevuta:", aiResponse);
    } catch (geminiError) {
        console.error("ERRORE GEMINI:", geminiError);
        throw new Error("Gemini ha fallito");
    }

    return NextResponse.json({ 
      response: aiResponse.message, 
      is_ended: !!aiResponse.is_ended 
    });

  } catch (error: any) {
    console.error("CRITICAL ERROR IN ROUTE:", error.message);
    
    // Forza il ritorno di un JSON anche se tutto esplode
    return new Response(JSON.stringify({ 
        response: "Squawk! Ho avuto un piccolo corto circuito. Riprova!", 
        is_ended: false,
        error: true 
    }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
  }
}