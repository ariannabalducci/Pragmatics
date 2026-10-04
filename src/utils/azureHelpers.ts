import { AzureOpenAI } from "openai";

const endpoint = process.env.AZURE_OPENAI_ENDPOINT || "";
const apiKey = process.env.AZURE_OPENAI_API_KEY || "";
const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || "";

// Without credentials the chat replies with a warning instead of crashing.
const client = endpoint && apiKey ? new AzureOpenAI({
  endpoint,
  apiKey,
  apiVersion: "2024-02-15-preview",
  deployment,
}) : null;

export async function chatWithAzure(userMessage: string, history: any[], systemInstruction: string) {
  if (!client) {
    return {
      message: "⚠️ Azure OpenAI is not configured. Set AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY and AZURE_OPENAI_DEPLOYMENT in .env.",
      is_ended: false
    };
  }

  try {
    // History arrives in the Gemini format ({ role: 'model', parts }) used by the client.
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
      response_format: { type: "json_object" }
    });

    const text = response.choices[0]?.message?.content || "{}";
    return JSON.parse(text);

  } catch (error: any) {
    console.error("Azure OpenAI error:", error.message);
    return {
      message: "Sorry, I'm a little tired right now. Try again! 🦜",
      is_ended: false
    };
  }
}
