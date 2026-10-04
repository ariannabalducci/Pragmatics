import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { chatWithAzure } from '@/utils/azureHelpers';
import { getAuthUser } from '@/lib/auth';

export async function POST(request: Request) {
  if (!getAuthUser(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { message, history, exerciseId } = body;

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

    const storyContext = JSON.stringify(exercise.contentJson);
    const systemPrompt = `Tu sei Praggy, un pappagallo amichevole e simpatico tutor. Stai parlando con un bambino per fargli sviluppare la comprensione della pragmatica.
Questo è l'esercizio in corso:
- Argomento: ${exercise.group?.topic}
- Storia completa: ${storyContext}

REGOLE FONDAMENTALI DEL TUO COMPORTAMENTO:
1. Valuta attentamente l'ultimo messaggio del bambino.
2. Rispondigli in modo discorsivo. Se sbaglia guidalo a capire il senso della metafora. Se risponde bene, congratulati con lui ma fagli un'altra domanda collegata o continua a far conversazione in modo spontaneo sull'argomento.
3. NON DEVI MAI CHIUDERE LA CONVERSAZIONE. Devi dare la possibilità all'utente di chattare all'infinito. Pertanto, imposta sempre e rigorosamente "is_ended": false in ogni tua risposta!
4. Parla solo in italiano.
5. Sii brevissimo (massimo 1 o 2 frasi). Non usare mai il grassetto ( ** ).
6. Restituisci RIGOROSAMENTE un oggetto JSON valido in questo formato: {"message": "la tua risposta testuale", "is_ended": false}`;

    let aiResponse;
    try {
        aiResponse = await chatWithAzure(message, history || [], systemPrompt);
    } catch (apiError) {
        console.error("ERRORE BACKEND AZURE:", apiError);
        throw new Error("Azure ha fallito");
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