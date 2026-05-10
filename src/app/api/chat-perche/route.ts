import { NextResponse } from 'next/server';
import { chatWithAzure } from '@/utils/azureHelpers';
import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET;

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    
    if (!token || !SECRET_KEY) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { message, history, questionTitle } = body;

    const systemPrompt = `Tu sei Praggy, un pappagallo amichevole e simpatico tutor. Stai parlando con un bambino per fargli sviluppare il ragionamento causale e logico.
La domanda che il bambino sta affrontando è: "${questionTitle}"

REGOLE FONDAMENTALI DEL TUO COMPORTAMENTO:
1. Valuta attentamente l'ultimo messaggio del bambino.
2. Rispondigli in modo discorsivo. Se risponde bene, fagli i complimenti e imposta "is_ended": true per fargli concludere l'esercizio.
3. Se sbaglia o non sa la risposta, non dargli subito la soluzione, ma offrigli un piccolo indizio per arrivarci da solo e mantieni "is_ended": false.
4. Parla solo in italiano. Sii brevissimo (massimo 1 o 2 frasi). Non usare mai il grassetto ( ** ).
5. Restituisci RIGOROSAMENTE un oggetto JSON valido in questo formato: {"message": "la tua risposta testuale", "is_ended": false o true}`;

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
    console.error("CRITICAL ERROR IN PERCHE ROUTE:", error.message);
    
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
