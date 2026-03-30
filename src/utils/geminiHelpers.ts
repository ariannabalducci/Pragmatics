import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { ChatHistory, GenerationConfig } from "@/types";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not defined");
}

const genAI = new GoogleGenerativeAI(apiKey);

interface AIResponse {
  message: string;
  is_ended: boolean;
}

export async function chattogemini(
  userMessage: string,
  history: ChatHistory[], // Ensure this is { role: 'user' | 'model', parts: [{ text: string }] }[]
  systemInstruction: string,
  modelName: string = "gemini-2.5-flash" // Use a model that supports JSON mode well
): Promise<AIResponse> {
  
  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: systemInstruction,
  });

  const generationConfig: GenerationConfig = {
    temperature: 1,
    topP: 0.95,
    responseMimeType: "application/json",
  };

  const chatSession = model.startChat({
    generationConfig,
    history: history,
  });

  let attempts = 0;
  const maxAttempts = 1;

  while (attempts < maxAttempts) {
    try {
      attempts++;
      const result = await chatSession.sendMessage(userMessage);
      const text = result.response.text();
      
      try {
        return JSON.parse(text) as AIResponse;
      } catch (parseError) {
        return { message: text, is_ended: false };
      }

    } catch (error: any) {
      console.error(`Attempt ${attempts} failed:`, error.message);
      
      if (attempts === maxAttempts) throw error;
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}