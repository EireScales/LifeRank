import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: Request) {
  try {
    const { question, profile } = (await request.json()) as { question?: string; profile?: unknown };

    if (!question) {
      return NextResponse.json({ error: "Please include a question." }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OPENAI_API_KEY is not configured." }, { status: 500 });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are LifeRank AI. Give concise, practical, empathetic coaching with concrete weekly actions based on user profile scores."
        },
        {
          role: "user",
          content: `Profile: ${JSON.stringify(profile)}\n\nQuestion: ${question}`
        }
      ],
      temperature: 0.7,
      max_tokens: 280
    });

    return NextResponse.json({ reply: completion.choices[0]?.message?.content ?? "No response generated." });
  } catch (error) {
    return NextResponse.json({ error: "LifeRank AI is currently unavailable." }, { status: 500 });
  }
}
