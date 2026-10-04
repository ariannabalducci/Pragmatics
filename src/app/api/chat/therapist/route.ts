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

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Missing chat messages" }, { status: 400 });
    }

    const lastUserMessage = messages[messages.length - 1].content;

    const history = messages.slice(0, -1).map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    // chatWithAzure parses the reply as JSON, so the prompt must ask for a JSON object.
    const systemPrompt = `You are the Senior Specialist AI Assistant of Praggymatics, an expert speech and language therapist specialized in Social (Pragmatic) Communication Disorders.

YOUR ROLE:
Provide advanced, evidence-based clinical support (EBP - Evidence-Based Practice). You help speech therapists plan treatments, interpret clinical pictures and stay up to date with the latest research.

CONTENT GUIDELINES:
1. RESEARCH AND SOURCES: When answering clinical or theoretical questions, cite (when possible) authors, recent studies (e.g. ASHA, Journal of Speech, Language, and Hearing Research) or international guidelines.
2. PRAGMATICS: Be very specific about aspects such as Theory of Mind, executive functions applied to language, inference and narrative skills.
3. PRACTICAL STRATEGIES: Every theoretical suggestion must be followed by a practical example of a speech therapy exercise that can be used in a session.
4. TONE: Use an academic but practical tone, typical of a consultation between senior colleagues.

FORMATTING RULES:
- Always answer in English.
- Use bold to highlight key concepts.
- When citing a source, format it clearly (e.g. [Author, Year]).

MANDATORY TECHNICAL RULE:
Reply ONLY with a valid JSON object.
Format: {"message": "answer content with sources and markdown", "is_ended": false}`;

    const aiResponse = await chatWithAzure(lastUserMessage, history, systemPrompt);

    if (!aiResponse || !aiResponse.message) {
      throw new Error("Azure returned no valid content.");
    }

    return NextResponse.json({
      message: aiResponse.message
    });

  } catch (error: any) {
    console.error("Therapist chat error:", error.message);

    return NextResponse.json({
      error: "Error while contacting the assistant."
    }, { status: 500 });
  }
}
