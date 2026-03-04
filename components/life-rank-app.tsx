"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AssessmentResult, Category, calculateAssessment, questions } from "@/lib/questions";

type Stage = "welcome" | "assessment" | "analysis" | "score" | "dashboard";

const categoryOrder: Category[] = ["Career", "Money", "Health", "Social", "Growth"];
const analysisMessages = [
  "Analyzing your life data...",
  "Comparing with people your age...",
  "Calculating your LifeRank score..."
];

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
  const [analysisStep, setAnalysisStep] = useState(0);
  const [timeline, setTimeline] = useState<number[]>([]);
  const [copied, setCopied] = useState(false);

  const currentQuestion = questions[step];
  const result = useMemo(() => calculateAssessment(answers), [answers]);
  const currentValue = answers[currentQuestion?.id] ?? currentQuestion?.defaultValue ?? 5;

  useEffect(() => {
    if (stage !== "analysis") return;

    setAnalysisStep(0);
    const first = setTimeout(() => setAnalysisStep(1), 650);
    const second = setTimeout(() => setAnalysisStep(2), 1300);
    const done = setTimeout(() => setStage("score"), 2000);

    return () => {
      clearTimeout(first);
      clearTimeout(second);
      clearTimeout(done);
    };
  }, [stage]);

  useEffect(() => {
    if (stage !== "dashboard") return;

    const key = "liferank-weekly-history";

    try {
      const existing = localStorage.getItem(key);

      if (!existing) {
        const initial = [result.lifeScore];
        setTimeline(initial);
        localStorage.setItem(key, JSON.stringify(initial));
        return;
      }

      const parsed = JSON.parse(existing) as number[];
      const normalized = Array.isArray(parsed) ? parsed.filter((value) => Number.isFinite(value)).map(Number) : [];

      if (!normalized.length) {
        const initial = [result.lifeScore];
        setTimeline(initial);
        localStorage.setItem(key, JSON.stringify(initial));
        return;
      }

      if (normalized[normalized.length - 1] !== result.lifeScore) {
        const updated = [...normalized, result.lifeScore].slice(-12);
        setTimeline(updated);
        localStorage.setItem(key, JSON.stringify(updated));
        return;
      }

      setTimeline(normalized);
    } catch {
      const fallback = [result.lifeScore];
      setTimeline(fallback);
      localStorage.setItem(key, JSON.stringify(fallback));
    }
  }, [stage, result.lifeScore]);

  const handleNext = () => {
    if (step < questions.length - 1) {
      setStep((prev) => prev + 1);
      return;
    }
    setStage("analysis");
  };

  const shareText = `My LifeRank Score: ${result.lifeScore}\nAhead of ${result.aheadPercent}% of people my age\nTop Strength: ${result.strongestCategory}\nBiggest Opportunity: ${result.weakestCategory}`;

  const onCopyResult = async () => {
    await navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const onDownloadShareImage = () => {
    const cardContent = [
      "LifeRank",
      `My LifeRank Score: ${result.lifeScore}`,
      `Ahead of ${result.aheadPercent}% of people your age`,
      `Top Strength: ${result.strongestCategory}`,
      `Biggest Opportunity: ${result.weakestCategory}`
    ];

    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#F6F7FB";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#FFFFFF";
    ctx.strokeStyle = "#E8ECF8";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(110, 180, 860, 700, 36);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#3A6DF0";
    ctx.font = "700 56px Inter, Arial";
    ctx.fillText("LifeRank", 180, 290);

    ctx.fillStyle = "#0F172A";
    ctx.font = "700 100px Inter, Arial";
    ctx.fillText(String(result.lifeScore), 180, 410);

    ctx.fillStyle = "#334155";
    ctx.font = "500 42px Inter, Arial";
    cardContent.slice(1).forEach((line, index) => {
      ctx.fillText(line, 180, 520 + index * 85);
    });

    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = url;
    link.download = "liferank-share.png";
    link.click();
  };

  const onShareTwitter = async () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "My LifeRank Score",
          text: shareText,
          url: window.location.href
        });
        return;
      } catch {
        // Fallback to X intent URL when user cancels or sharing is unavailable.
      }
    }

    window.open(twitterUrl, "_blank", "noopener,noreferrer");
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
          profile: {
            score: result.lifeScore,
            career: result.categories.Career,
            money: result.categories.Money,
            health: result.categories.Health,
            social: result.categories.Social,
            growth: result.categories.Growth,
            weakestCategories: result.opportunities.map((item) => item.category)
          }
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
          <p className="text-sm font-medium text-slate-600">
            Question {step + 1} of {questions.length}
          </p>
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

            <button onClick={handleNext} className="mt-8 w-full rounded-2xl bg-slate-900 px-4 py-3 font-medium text-white">
              {step === questions.length - 1 ? "Reveal My LifeRank" : "Continue"}
            </button>
          </Card>
        </section>
      )}

      {stage === "analysis" && (
        <section className="flex min-h-[80vh] animate-rise items-center justify-center">
          <Card className="w-full text-center">
            <div className="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-4 border-primary/25 border-t-primary" />
            <p className="text-lg font-semibold text-slate-800 transition-all">{analysisMessages[analysisStep]}</p>
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
            <h3 className="mb-3 text-lg font-semibold">Potential Score</h3>
            <div className="space-y-2 text-sm text-slate-700">
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                <span>Current Score</span>
                <span className="font-semibold text-primary">{result.lifeScore}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                <span>Potential Score</span>
                <span className="font-semibold text-accent">{result.potentialScore}</span>
              </div>
              <p className="pt-1 text-xs text-slate-500">You are currently operating at {result.potentialUtilizationPercent}% of your potential.</p>
            </div>
          </Card>

          <Card>
            <h3 className="mb-4 text-lg font-semibold">Category Breakdown</h3>
            <CategoryBars categories={result.categories} />
          </Card>

          <Card>
            <h3 className="mb-3 text-lg font-semibold">Shareable Result</h3>
            <div className="rounded-2xl bg-gradient-to-br from-primary to-accent p-4 text-white">
              <p className="text-sm font-semibold uppercase tracking-wide text-white/80">My LifeRank Score: {result.lifeScore}</p>
              <p className="mt-2 text-sm">Ahead of {result.aheadPercent}% of people your age</p>
              <p className="mt-4 text-sm">Top Strength: {result.strongestCategory}</p>
              <p className="text-sm">Biggest Opportunity: {result.weakestCategory}</p>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
              <button onClick={onCopyResult} className="rounded-xl bg-slate-100 px-3 py-2 font-medium text-slate-800">{copied ? "Copied!" : "Copy Result"}</button>
              <button onClick={onDownloadShareImage} className="rounded-xl bg-slate-100 px-3 py-2 font-medium text-slate-800">Download Share Image</button>
              <button onClick={onShareTwitter} className="rounded-xl bg-slate-900 px-3 py-2 font-medium text-white">Share on X/Twitter</button>
            </div>
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
            <h3 className="text-lg font-semibold">LifeRank Progress</h3>
            <div className="mt-4 space-y-2 text-sm text-slate-700">
              {timeline.map((score, index) => (
                <div key={`${score}-${index}`} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                  <span>Week {index + 1}</span>
                  <span className="font-semibold text-primary">{score}</span>
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
