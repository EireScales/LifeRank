"use client";

import { FormEvent, useMemo, useState } from "react";
import { AssessmentResult, Category, calculateAssessment, questions } from "@/lib/questions";

type Stage = "welcome" | "assessment" | "score" | "dashboard";

const categoryOrder: Category[] = ["Career", "Money", "Health", "Social", "Growth"];

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-3xl bg-white p-6 shadow-card ${className}`}>{children}</div>;
}

function CategoryBars({ categories }: { categories: AssessmentResult["categories"] }) {
  return (
    <div className="space-y-4">
      {categoryOrder.map((category) => (
        <div key={category}>
          <div className="mb-1 flex justify-between text-sm font-medium text-slate-600">
            <span>{category}</span>
            <span>{categories[category]}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-700"
              style={{ width: `${categories[category]}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function LifeRankApp() {
  const [stage, setStage] = useState<Stage>("welcome");
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [chatInput, setChatInput] = useState("");
  const [chatReply, setChatReply] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const currentQuestion = questions[step];
  const result = useMemo(() => calculateAssessment(answers), [answers]);

  const currentValue = answers[currentQuestion?.id] ?? currentQuestion?.defaultValue ?? 5;

  const handleNext = () => {
    if (step < questions.length - 1) {
      setStep((prev) => prev + 1);
      return;
    }
    setStage("score");
  };

  const onAskAI = async (event: FormEvent) => {
    event.preventDefault();
    if (!chatInput.trim()) return;

    try {
      setChatLoading(true);
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: chatInput,
          profile: result
        })
      });

      const data = (await response.json()) as { reply?: string; error?: string };
      setChatReply(data.reply ?? data.error ?? "No response available.");
    } catch {
      setChatReply("Unable to connect to LifeRank AI right now. Please try again soon.");
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-md px-4 py-6 text-slate-900">
      {stage === "welcome" && (
        <section className="flex min-h-[92vh] animate-rise flex-col justify-center">
          <Card className="text-center">
            <div className="mb-6 inline-flex rounded-full bg-primary/10 px-4 py-1 text-sm font-semibold text-primary">LifeRank</div>
            <h1 className="text-3xl font-semibold leading-tight">Discover where you actually stand in life.</h1>
            <p className="mt-4 text-sm text-slate-600">Take a 2 minute life assessment and get your LifeRank score.</p>
            <button
              className="mt-8 w-full rounded-2xl bg-gradient-to-r from-primary to-accent px-4 py-3 font-medium text-white transition hover:opacity-95"
              onClick={() => setStage("assessment")}
            >
              Start Assessment
            </button>
          </Card>
        </section>
      )}

      {stage === "assessment" && currentQuestion && (
        <section className="animate-rise space-y-4">
          <p className="text-sm font-medium text-slate-600">Question {step + 1} of {questions.length}</p>
          <div className="h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
              style={{ width: `${((step + 1) / questions.length) * 100}%` }}
            />
          </div>
          <Card>
            <h2 className="text-2xl font-semibold">{currentQuestion.label}</h2>

            {currentQuestion.type === "slider" ? (
              <div className="mt-8">
                <input
                  type="range"
                  min={currentQuestion.min}
                  max={currentQuestion.max}
                  value={currentValue}
                  onChange={(e) => setAnswers((prev) => ({ ...prev, [currentQuestion.id]: Number(e.target.value) }))}
                  className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-primary"
                />
                <div className="mt-2 text-center text-lg font-semibold text-primary">{currentValue}/10</div>
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                {currentQuestion.options?.map((option) => (
                  <button
                    key={option.label}
                    onClick={() => setAnswers((prev) => ({ ...prev, [currentQuestion.id]: option.value }))}
                    className={`w-full rounded-2xl border px-4 py-3 text-left text-sm transition ${
                      currentValue === option.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-slate-200 bg-white hover:border-primary/50"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={handleNext}
              className="mt-8 w-full rounded-2xl bg-slate-900 px-4 py-3 font-medium text-white"
            >
              {step === questions.length - 1 ? "Reveal My LifeRank" : "Continue"}
            </button>
          </Card>
        </section>
      )}

      {stage === "score" && (
        <section className="animate-rise space-y-4">
          <Card className="text-center">
            <p className="text-sm uppercase tracking-wide text-slate-500">Your LifeRank Score</p>
            <div className="my-4 text-7xl font-bold text-primary">{result.lifeScore}</div>
            <p className="text-sm text-slate-600">You are ahead of {result.aheadPercent}% of people your age.</p>
          </Card>

          <Card>
            <h3 className="mb-4 text-lg font-semibold">Category Breakdown</h3>
            <CategoryBars categories={result.categories} />
          </Card>

          <Card className="space-y-3">
            <h3 className="text-lg font-semibold">Locked Insights</h3>
            {["Life Projection", "AI Life Coach", "Improvement Plan"].map((item) => (
              <div key={item} className="relative overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-slate-600">
                {item}
                <div className="pointer-events-none absolute inset-0 bg-white/40 backdrop-blur-[2px]" />
              </div>
            ))}
            <button
              onClick={() => setStage("dashboard")}
              className="w-full rounded-2xl bg-gradient-to-r from-primary to-accent px-4 py-3 font-medium text-white"
            >
              Unlock Full LifeRank Analysis
            </button>
          </Card>
        </section>
      )}

      {stage === "dashboard" && (
        <section className="animate-rise space-y-4 pb-6">
          <Card>
            <p className="text-sm text-slate-500">LifeRank Score</p>
            <div className="text-5xl font-bold text-primary">{result.lifeScore}</div>
            <p className="mt-2 text-sm text-slate-600">Your personalized dashboard is ready.</p>
          </Card>

          <Card>
            <h3 className="mb-4 text-lg font-semibold">Category breakdown</h3>
            <CategoryBars categories={result.categories} />
          </Card>

          <Card>
            <h3 className="text-lg font-semibold">Biggest Opportunities</h3>
            <div className="mt-4 space-y-2 text-sm text-slate-700">
              {result.opportunities.map((item) => (
                <div key={item.category} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                  <span>{item.category}</span>
                  <span className="font-semibold text-accent">+{item.potential} potential</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold">Ask LifeRank AI</h3>
            <form onSubmit={onAskAI} className="mt-4 space-y-3">
              <textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="How can I improve my social score in 30 days?"
                className="min-h-24 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-primary transition focus:ring-2"
              />
              <button
                type="submit"
                disabled={chatLoading}
                className="w-full rounded-2xl bg-slate-900 px-4 py-3 font-medium text-white disabled:opacity-60"
              >
                {chatLoading ? "Thinking..." : "Ask AI"}
              </button>
            </form>
            {chatReply && <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">{chatReply}</p>}
          </Card>
        </section>
      )}
    </main>
  );
}
