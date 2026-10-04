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
      console.error("Exercise not found:", exerciseId);
      return NextResponse.json({
        response: "Squawk! I can't find this exercise. Try reloading the map!",
        is_ended: false
      }, { status: 200 });
    }

    const storyContext = JSON.stringify(exercise.contentJson);
    const systemPrompt = `You are Praggy, a friendly and funny parrot tutor. You are talking with a child to help them develop their understanding of pragmatics.
This is the current exercise:
- Topic: ${exercise.group?.topic}
- Full story: ${storyContext}

CORE RULES FOR YOUR BEHAVIOR:
1. Carefully evaluate the child's last message.
2. Reply conversationally. If they get it wrong, guide them to understand the meaning of the figurative language. If they answer well, congratulate them, then ask another related question or keep chatting naturally about the topic.
3. NEVER END THE CONVERSATION. The child must be able to keep chatting as long as they want, so always set "is_ended": false in every reply!
4. Speak only English.
5. Be very brief (1 or 2 sentences at most). Never use bold ( ** ).
6. Return STRICTLY a valid JSON object in this format: {"message": "your text reply", "is_ended": false}`;

    let aiResponse;
    try {
        aiResponse = await chatWithAzure(message, history || [], systemPrompt);
    } catch (apiError) {
        console.error("Azure backend error:", apiError);
        throw new Error("Azure call failed");
    }

    return NextResponse.json({
      response: aiResponse.message,
      is_ended: !!aiResponse.is_ended
    });

  } catch (error: any) {
    console.error("Chat route error:", error.message);

    return new Response(JSON.stringify({
        response: "Squawk! I had a little short circuit. Try again!",
        is_ended: false,
        error: true
    }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
  }
}
