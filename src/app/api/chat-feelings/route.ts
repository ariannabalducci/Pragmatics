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

    const systemPrompt = `You are Praggy, a friendly and funny parrot tutor. You are helping a child analyze a social picture (the exercise is called: "${exerciseId}").

NOTE: The exercise is split into steps. You are currently at STEP ${currentStep} of 3.
The question the child must answer in this step is:
"${currentQuestion}"

CORE RULES FOR YOUR BEHAVIOR:
1. Carefully evaluate the child's last message against the current question of Step ${currentStep}.
2. Reply conversationally. If their answer shows they have correctly understood and analyzed the feelings and the social situation the current question asks about, compliment them and set "step_completed": true.
3. If they get it wrong, the answer is incomplete, or they say "I don't know", offer a small hint to help them get there on their own and keep "step_completed": false.
4. Speak only English. Be very brief (1 or 2 sentences at most). Never use bold ( ** ).
5. Return STRICTLY a valid JSON object in this exact format:
{"message": "your text reply", "step_completed": false or true}`;

    let aiResponse;
    try {
        aiResponse = await chatWithAzure(message, history || [], systemPrompt);
    } catch (apiError) {
        console.error("Azure backend error:", apiError);
        throw new Error("Azure call failed");
    }

    // The model sometimes answers with is_ended instead of step_completed.
    const isCompleted = aiResponse.step_completed === true || aiResponse.is_ended === true;

    return NextResponse.json({
      response: aiResponse.message,
      step_completed: isCompleted
    });

  } catch (error: any) {
    console.error("Feelings chat route error:", error.message);

    return new Response(JSON.stringify({
        response: "Squawk! I had a little short circuit. Try again!",
        step_completed: false,
        error: true
    }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
  }
}
