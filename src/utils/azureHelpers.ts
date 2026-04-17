import { AzureOpenAI } from "openai";

const endpoint = process.env.AZURE_OPENAI_ENDPOINT || "";
const apiKey = process.env.AZURE_OPENAI_API_KEY || "";
const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || "";

// Se mancano le chiavi Azure nel .env, non proviamo neanche ad avviare il client vero per evitare crash
const client = endpoint && apiKey ? new AzureOpenAI({
  endpoint,
  apiKey,
  apiVersion: "2024-02-15-preview", // API version standard stabile
  deployment,
}) : null;

export async function chatWithAzure(userMessage: string, history: any[], systemInstruction: string) {
  if (!client) {
    return {
      message: "⚠️ ATTENZIONE: Mancano le credenziali di Azure nel file .env! Inserisci AZURE_OPENAI_API_KEY e gli altri parametri.",
      is_ended: false
    };
  }

  try {
    console.log(`--- CHIAMATA AZURE OPENAI (${deployment}) ---`);

    // Mappatura della history (Il frontend usava il formato Gemini, noi lo traduciamo per OpenAI)
    const formattedHistory = history.map((msg: any) => ({
      role: msg.role === 'model' ? 'assistant' : 'user',
      content: msg.parts?.[0]?.text || msg.content || ""
    }));

    const messages = [
      { role: "system", content: systemInstruction },
      ...formattedHistory,
      { role: "user", content: userMessage }
    ];

    const response = await client.chat.completions.create({
      messages: messages as any,
      model: deployment,
      response_format: { type: "json_object" } // Forza la risposta in JSON nativamente
    });

    const text = response.choices[0]?.message?.content || "{}";
    return JSON.parse(text);

  } catch (error: any) {
    console.error("LOG ERRORE AZURE:", error.message);
    return {
      message: "Scusa, anche Azure Microsoft in questo momento si sente stanco. Riprova! 🦜",
      is_ended: false
    };
  }
}
