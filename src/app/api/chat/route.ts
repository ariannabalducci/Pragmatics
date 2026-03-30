import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { chattogemini } from '@/utils/geminiHelpers';
import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET;

const verifyToken = (req: Request) => {
  if (!SECRET_KEY) return null;
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return null;
    const token = authHeader.split(' ')[1];
    return jwt.verify(token, SECRET_KEY) as { userId: string; role: string };
  } catch {
    return null;
  }
};

export async function POST(request: Request) {
  try {
    const authUser = verifyToken(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { message, history, exerciseId } = body;

    if (!message || !exerciseId) {
      return NextResponse.json({ error: "Missing message or exerciseId" }, { status: 400 });
    }

    const exercise = await prisma.exercise.findUnique({
      where: { id: exerciseId },
      select: { 
        group: {
          select: {
            title: true,
            topic: true,
          }
        },
        contentJson: true
      }
    });

    if (!exercise) {
      return NextResponse.json({ error: "Exercise not found" }, { status: 404 });
    }

    const systemPrompt = `
      You are Praggy, a friendly, helpful parrot teaching pragmatic communication to a child.
      
      CURRENT EXERCISE CONTEXT:
      Title: ${exercise.group?.title}
      Topic: ${exercise.group?.topic}
      Scenario Data: ${JSON.stringify(exercise.contentJson)}

      YOUR GOAL:
      The child must identify or explain the pragmatic concept (e.g., sarcasm, emotions) in this scenario.
      
      RULES:
      1. Look at the chat history (if existant). 
      2. Keep your answers SHORT (max 2 sentences). You are a parrot, you speak simply. Also avoid using bold, italics or any formatting. Just plain text.
      3. If the user's answer is correct or shows good understanding, set "is_ended": true.
      4. If the user is wrong, give a helpful hint and set "is_ended": false.
      5. NEVER step out of character. You are a parrot.
      6. Output MUST be valid JSON: { "message": "string", "is_ended": boolean }
    `;

    const aiResponse = await chattogemini(
      message,
      history || [],
      systemPrompt
    );

    return NextResponse.json({ 
      response: aiResponse.message, 
      is_ended: aiResponse.is_ended 
    });

} catch (error: any) {
    console.error("Chat API Error:", error);

    let fallbackMessage = "Squawk! My brain is tired. I need a short nap. Try again later!";

    return NextResponse.json({ 
      response: fallbackMessage, 
      is_ended: false,
      error: true
    }, { status: 200 }); 
  }
}