import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { body } = await request.json();

    if (!body || body.trim().length < 50) {
      return NextResponse.json(
        { error: 'Post body too short to summarize' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    const prompt = `You are a professional blog editor for Hivon Blogs. Provide a meaningful, comprehensive summary of the following blog post. The summary should be approximately 200 words in length, ensuring it captures all major themes, arguments, and conclusions. 
    
    Structure the summary to be engaging, insightful, and readable. Write in a sophisticated third-person style. Do not use headers or bullet points—provide a clean, cohesive narrative.
    
    Blog post:
    ${body.slice(0, 8000)}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.error?.message || 'Gemini API error' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const summary =
      data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Summary generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate summary' },
      { status: 500 }
    );
  }
}
