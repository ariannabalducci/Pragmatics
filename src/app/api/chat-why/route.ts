import { NextResponse } from 'next/server';
import { chatWithAzure } from '@/utils/azureHelpers';
import { getAuthUser } from '@/lib/auth';

export async function POST(request: Request) {
  if (!getAuthUser(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { message, history, questionTitle } = body;

    const systemPrompt = `You are Praggy, a friendly and funny parrot tutor. You are talking with a child to help them develop causal and logical reasoning.
The question the child is working on is: "${questionTitle}"

CORE RULES FOR YOUR BEHAVIOR:
1. Carefully evaluate the child's last message.
2. Reply conversationally. If they answer well, compliment them and set "is_ended": true so they can finish the exercise.
3. If they get it wrong or don't know the answer, don't give them the solution right away: offer a small hint to help them get there on their own and keep "is_ended": false.
4. Speak only English. Be very brief (1 or 2 sentences at most). Never use bold ( ** ).
5. Return STRICTLY a valid JSON object in this format: {"message": "your text reply", "is_ended": false or true}`;

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
    console.error("Why chat route error:", error.message);

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
