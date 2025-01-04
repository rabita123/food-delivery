import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Check if API key is configured
const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.error('OPENAI_API_KEY is not configured in environment variables');
}

// Configure OpenAI client
const openai = new OpenAI({
  apiKey: apiKey,
});

export async function POST(request: Request) {
  try {
    if (!apiKey) {
      throw new Error('OpenAI API key is not configured');
    }

    const body = await request.json();
    console.log('Processing AI request:', {
      action: body.action,
      dishName: body.dishName,
      cuisine: body.cuisine
    });

    const { action, dishName, cuisine } = body;

    if (!action || !dishName || !cuisine) {
      console.error('Missing parameters:', { action, dishName, cuisine });
      return NextResponse.json(
        { error: 'Missing required parameters', details: { action, dishName, cuisine } },
        { status: 400 }
      );
    }

    if (action === 'suggestPairings') {
      try {
        const completion = await openai.chat.completions.create({
          messages: [
            {
              role: "system",
              content: "You are a helpful culinary expert who provides concise, practical dish pairing suggestions."
            },
            {
              role: "user",
              content: `Suggest 3 complementary dishes that would pair well with ${dishName} (${cuisine} cuisine). Focus on flavor combinations and traditional pairings. Format each suggestion on a new line.`
            }
          ],
          model: "gpt-3.5-turbo",
          temperature: 0.7,
          max_tokens: 150
        });

        const suggestions = completion.choices[0].message.content?.split('\n').filter(Boolean) || [];
        return NextResponse.json({ result: suggestions });
      } catch (openaiError: any) {
        console.error('OpenAI API Error:', {
          error: openaiError,
          message: openaiError.message,
          status: openaiError.status,
          data: openaiError.response?.data
        });
        
        // Return a more user-friendly error message
        return NextResponse.json(
          { 
            error: 'AI request failed',
            details: 'Failed to generate dish pairings. Please try again later.'
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('AI API error:', error);
    return NextResponse.json(
      { 
        error: 'AI request failed',
        details: 'An unexpected error occurred. Please try again later.'
      },
      { status: 500 }
    );
  }
} 