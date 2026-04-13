import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function chattogemini(userMessage: string, history: any[], systemInstruction: string) {
  
  // Usiamo il 2.5 perché è l'UNICO che il tuo account riconosce
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash" 
  });

  try {
    console.log("--- CHIAMATA MODELLO 2.5 ---");
    
    const prompt = `
      ${systemInstruction}
      STORIA: ${JSON.stringify(history)}
      UTENTE: ${userMessage}
      RISPONDI SOLO JSON: {"message": "...", "is_ended": false}
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    const cleanText = text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanText);

  } catch (error: any) {
    console.error("LOG ERRORE:", error.message);

    // Se il server è occupato (503), diamo un messaggio gentile all'utente
    if (error.message.includes("503") || error.message.includes("Service Unavailable")) {
        return {
          message: "Scusa, in questo momento i server di Google sono carichi. Riprova tra 5 secondi! 🦜",
          is_ended: false
        };
    }

    return {
      message: "Ops, Praggy ha avuto un giramento di testa. Riprova!",
      is_ended: false
    };
  }
}