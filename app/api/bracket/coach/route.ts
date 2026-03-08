import { NextRequest, NextResponse } from 'next/server';
import openai from 'openai';

// Initialize OpenAI SDK
const openaiClient = new openai.OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { bracket } = await request.json();

    if (!bracket) {
      return NextResponse.json({ error: 'Bracket data is required' }, { status: 400 });
    }

    const response = await openaiClient.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an AI-driven coaching assistant for basketball bracket strategy.',
        },
        {
          role: 'user',
          content: `Analyze the following bracket: ${JSON.stringify(bracket)}`,
        },
      ],
      max_tokens: 150,
    });

    const advice = response.choices[0].message.content;
    return NextResponse.json({ advice });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}