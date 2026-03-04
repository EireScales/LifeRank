import OpenAI from "openai";
import { NextResponse } from "next/server";

type LifeRankProfile = {
  score: number;
  career: number;
  money: number;
  health: number;
  social: number;
  growth: number;
  weakestCategories?: string[];
};

export async function POST(request: Request) {
  try {
    const { question, profile } = (await request.json()) as { question?: string; profile?: LifeRankProfile };

    if (!question) {
      return NextResponse.json({ error: "Please include a question." }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OPENAI_API_KEY is not configured." }, { status: 500 });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const context = profile
      ? [
          "User LifeRank Profile:",
          `Score: ${profile.score}`,
          `Career score: ${profile.career}`,
          `Money score: ${profile.money}`,
          `Health score: ${profile.health}`,
          `Social score: ${profile.social}`,
          `Growth score: ${profile.growth}`,
          `Weakest categories: ${(profile.weakestCategories ?? []).join(", ") || "Not available"}`
        ].join("\n")
      : "User LifeRank Profile: Not available";

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are LifeRank AI, a supportive self-improvement coach. Give practical, encouraging, and specific weekly actions. Focus advice on weakest categories first. Keep responses concise (under 180 words) and include an immediate next step for today."
        },
        {
          role: "user",
          content: `${context}\n\nQuestion: ${question}`
        }
      ],
      temperature: 0.7,
      max_tokens: 320
    });

    return NextResponse.json({ reply: completion.choices[0]?.message?.content ?? "No response generated." });
  } catch {
    return NextResponse.json({ error: "LifeRank AI is currently unavailable." }, { status: 500 });
  }
}
