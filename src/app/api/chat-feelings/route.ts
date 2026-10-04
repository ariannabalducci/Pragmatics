import { NextResponse } from 'next/server';
import { chatWithAzure } from '@/utils/azureHelpers';
import { getAuthUser } from '@/lib/auth';

export async function POST(request: Request) {
  if (!getAuthUser(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { exerciseId, currentStep, currentQuestion, message, history } = body;

    const systemPrompt = `Tu sei Praggy, un pappagallo amichevole e simpatico tutor. Stai aiutando un bambino ad analizzare un'immagine sociale (l'esercizio si chiama: "${exerciseId}").

ATTENZIONE: L'esercizio è diviso in step. Attualmente siete allo STEP ${currentStep} di 3.
La domanda a cui il bambino deve rispondere in questo step è:
"${currentQuestion}"

REGOLE FONDAMENTALI DEL TUO COMPORTAMENTO:
1. Valuta attentamente l'ultimo messaggio del bambino rispetto alla domanda corrente dello Step ${currentStep}.
2. Rispondigli in modo discorsivo. Se la sua risposta dimostra di aver compreso e analizzato correttamente i sentimenti e la situazione sociale richiesta dalla domanda corrente, fagli i complimenti e imposta "step_completed": true.
3. Se sbaglia, non è completo, o dice "non lo so", offrigli un piccolo indizio per arrivarci da solo e mantieni "step_completed": false.
4. Parla solo in italiano. Sii brevissimo (massimo 1 o 2 frasi). Non usare mai il grassetto ( ** ).
5. Restituisci RIGOROSAMENTE un oggetto JSON valido in questo formato esatto:
{"message": "la tua risposta testuale", "step_completed": false o true}`;

    let aiResponse;
    try {
        aiResponse = await chatWithAzure(message, history || [], systemPrompt);
    } catch (apiError) {
        console.error("ERRORE BACKEND AZURE:", apiError);
        throw new Error("Azure ha fallito");
    }

    // Nota: aiResponse.is_ended o aiResponse.step_completed dipendono da come l'AI formatta il JSON. 
    // Dobbiamo estrarlo in modo sicuro.
    const isCompleted = aiResponse.step_completed === true || aiResponse.is_ended === true;

    return NextResponse.json({ 
      response: aiResponse.message, 
      step_completed: isCompleted
    });

  } catch (error: any) {
    console.error("CRITICAL ERROR IN SENTIMENTI ROUTE:", error.message);
    
    return new Response(JSON.stringify({ 
        response: "Squawk! Ho avuto un piccolo corto circuito. Riprova!", 
        step_completed: false,
        error: true 
    }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
  }
}
