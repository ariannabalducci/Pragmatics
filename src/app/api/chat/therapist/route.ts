import { NextResponse } from 'next/server';
import { chatWithAzure } from '@/utils/azureHelpers';
import { getAuthUser } from '@/lib/auth';

export async function POST(request: Request) {
  const authUser = getAuthUser(request);
  if (!authUser || authUser.role !== 'THERAPIST') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { messages } = body;

    // Validazione input
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Dati della chat mancanti" }, { status: 400 });
    }

    // Estrazione dell'ultimo messaggio dell'utente
    const lastUserMessage = messages[messages.length - 1].content;
    
    // Mappatura della storia per l'helper (formato richiesto: role 'model'/'user' e parts)
    const history = messages.slice(0, -1).map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    /**
     * SYSTEM PROMPT PERSONALIZZATO PER IL TERAPISTA
     * Nota: Manteniamo l'obbligo del JSON perché il tuo azureHelpers lo richiede per il parsing.
     */
    const systemPrompt = `Sei l'Assistente AI Senior Specialist di Praggymatics, un esperto in Logopedia con specializzazione in Disturbi della Comunicazione Sociale e Pragmatica. 

IL TUO RUOLO:
Fornire supporto clinico avanzato basato sulle evidenze (EBP - Evidence-Based Practice). Aiuti i logopedisti a pianificare trattamenti, interpretare quadri clinici e rimanere aggiornati sugli ultimi studi.

LINEE GUIDA PER IL CONTENUTO:
1. RICERCA E FONTI: Quando rispondi a domande cliniche o teoriche, cita (se possibile) autori, studi recenti (es. ASHA, studi su Journal of Speech, Language, and Hearing Research) o linee guida internazionali.
2. PRAGMATICA: Sii estremamente specifico su aspetti come la Teoria della Mente, le funzioni esecutive applicate al linguaggio, l'inferenza e le abilità narrative.
3. STRATEGIE PRATICHE: Ogni suggerimento teorico deve essere seguito da un esempio pratico di esercizio logopedico applicabile in seduta.
4. TIPO DI RISPOSTA: Usa un tono accademico ma operativo, tipico di una consulenza tra colleghi senior.

REGOLE DI FORMATTAZIONE:
- Rispondi sempre in lingua italiana.
- Usa il grassetto per evidenziare i concetti chiave.
- Se citi una fonte, formattala chiaramente (es: [Autore, Anno]).

REGOLA TECNICA OBBLIGATORIA: 
Rispondi ESCLUSIVAMENTE con un oggetto JSON valido.
Formato: {"message": "contenuto della risposta con fonti e markdown", "is_ended": false}`;
    // Chiamata all'helper che gestisce la connessione Azure OpenAI
    const aiResponse = await chatWithAzure(lastUserMessage, history, systemPrompt);

    // Verifica che l'helper abbia restituito dati validi
    if (!aiResponse || !aiResponse.message) {
      throw new Error("Azure non ha restituito un contenuto valido.");
    }

    return NextResponse.json({ 
      message: aiResponse.message 
    });

  } catch (error: any) {
    console.error("ERRORE API CHAT TERAPISTA:", error.message);
    
    return NextResponse.json({
      error: "Errore durante la comunicazione con l'assistente."
    }, { status: 500 });
  }
}