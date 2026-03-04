export type Category = "Career" | "Money" | "Health" | "Social" | "Growth";

type Option = { label: string; value: number };

export type Question = {
  id: string;
  label: string;
  category: Category;
  type: "slider" | "multiple";
  min?: number;
  max?: number;
  options?: Option[];
  defaultValue?: number;
};

export const questions: Question[] = [
  {
    id: "age-group",
    label: "What is your age group?",
    category: "Growth",
    type: "multiple",
    options: [
      { label: "18-24", value: 78 },
      { label: "25-34", value: 82 },
      { label: "35-44", value: 74 },
      { label: "45-54", value: 68 },
      { label: "55+", value: 65 }
    ]
  },
  {
    id: "country",
    label: "How would you rate your country's opportunity environment?",
    category: "Career",
    type: "multiple",
    options: [
      { label: "High opportunity", value: 90 },
      { label: "Growing opportunity", value: 75 },
      { label: "Limited opportunity", value: 55 }
    ]
  },
  { id: "career-satisfaction", label: "Career satisfaction", category: "Career", type: "slider", min: 1, max: 10, defaultValue: 5 },
  { id: "career-confidence", label: "Career confidence", category: "Career", type: "slider", min: 1, max: 10, defaultValue: 5 },
  {
    id: "skill-frequency",
    label: "How often do you improve your skills?",
    category: "Growth",
    type: "multiple",
    options: [
      { label: "Daily", value: 95 },
      { label: "A few times per week", value: 80 },
      { label: "Weekly", value: 65 },
      { label: "Rarely", value: 35 }
    ]
  },
  { id: "income-situation", label: "Income situation", category: "Money", type: "slider", min: 1, max: 10, defaultValue: 5 },
  { id: "savings-level", label: "Savings level", category: "Money", type: "slider", min: 1, max: 10, defaultValue: 5 },
  {
    id: "saving-habits",
    label: "How consistent are your saving habits?",
    category: "Money",
    type: "multiple",
    options: [
      { label: "Automatic monthly savings", value: 95 },
      { label: "I save when possible", value: 68 },
      { label: "I rarely save", value: 30 }
    ]
  },
  { id: "exercise-frequency", label: "Exercise frequency", category: "Health", type: "slider", min: 1, max: 10, defaultValue: 5 },
  { id: "sleep-hours", label: "Average sleep quality and duration", category: "Health", type: "slider", min: 1, max: 10, defaultValue: 5 },
  { id: "energy-level", label: "Daily energy levels", category: "Health", type: "slider", min: 1, max: 10, defaultValue: 5 },
  {
    id: "social-interactions",
    label: "Meaningful social interactions per week",
    category: "Social",
    type: "multiple",
    options: [
      { label: "10+", value: 92 },
      { label: "5-9", value: 76 },
      { label: "2-4", value: 58 },
      { label: "0-1", value: 30 }
    ]
  },
  {
    id: "close-friends",
    label: "Do you have close friends you can rely on?",
    category: "Social",
    type: "multiple",
    options: [
      { label: "Yes, several", value: 95 },
      { label: "A couple", value: 75 },
      { label: "Not really", value: 40 }
    ]
  },
  { id: "social-satisfaction", label: "Social satisfaction", category: "Social", type: "slider", min: 1, max: 10, defaultValue: 5 },
  { id: "learning-hours", label: "Learning hours per week", category: "Growth", type: "slider", min: 1, max: 10, defaultValue: 5 },
  {
    id: "reading-frequency",
    label: "Reading frequency",
    category: "Growth",
    type: "multiple",
    options: [
      { label: "Daily", value: 94 },
      { label: "Few times weekly", value: 78 },
      { label: "Occasionally", value: 55 },
      { label: "Rarely", value: 32 }
    ]
  },
  { id: "goal-setting", label: "Goal setting consistency", category: "Growth", type: "slider", min: 1, max: 10, defaultValue: 5 },
  {
    id: "social-media",
    label: "Daily social media usage",
    category: "Health",
    type: "multiple",
    options: [
      { label: "< 1 hour", value: 92 },
      { label: "1-2 hours", value: 74 },
      { label: "3-4 hours", value: 52 },
      { label: "5+ hours", value: 28 }
    ]
  }
];

export type AssessmentResult = {
  categories: Record<Category, number>;
  lifeScore: number;
  aheadPercent: number;
  potentialScore: number;
  potentialUtilizationPercent: number;
  averagePossibleImprovement: number;
  strongestCategory: Category;
  weakestCategory: Category;
  opportunities: { category: Category; potential: number }[];
};

const categoryWeights: Record<Category, number> = {
  Career: 0.25,
  Money: 0.2,
  Health: 0.2,
  Social: 0.15,
  Growth: 0.2
};

const sliderTo100 = (value: number) => Math.round(((value - 1) / 9) * 100);

export function calculateAssessment(answers: Record<string, number>): AssessmentResult {
  const buckets: Record<Category, number[]> = {
    Career: [],
    Money: [],
    Health: [],
    Social: [],
    Growth: []
  };

  for (const question of questions) {
    const rawValue = answers[question.id] ?? question.defaultValue ?? 5;
    const value = question.type === "slider" ? sliderTo100(rawValue) : rawValue;
    buckets[question.category].push(value);
  }

  const categories = Object.entries(buckets).reduce((acc, [key, values]) => {
    const average = values.length ? values.reduce((sum, v) => sum + v, 0) / values.length : 0;
    acc[key as Category] = Math.round(Math.min(100, Math.max(0, average)));
    return acc;
  }, {} as Record<Category, number>);

  const lifeScore = Math.round(
    categories.Career * categoryWeights.Career +
      categories.Money * categoryWeights.Money +
      categories.Health * categoryWeights.Health +
      categories.Social * categoryWeights.Social +
      categories.Growth * categoryWeights.Growth
  );

  const opportunities = (Object.entries(categories) as [Category, number][])
    .map(([category, value]) => ({ category, potential: Math.max(0, 100 - value) }))
    .sort((a, b) => b.potential - a.potential);

  const averagePossibleImprovement = Math.round(
    opportunities.reduce((sum, item) => sum + item.potential, 0) / opportunities.length
  );

  const potentialScore = lifeScore + averagePossibleImprovement;
  const potentialUtilizationPercent = Math.round((lifeScore / Math.max(1, potentialScore)) * 100);

  const strongestCategory = [...(Object.entries(categories) as [Category, number][])].sort((a, b) => b[1] - a[1])[0][0];
  const weakestCategory = [...(Object.entries(categories) as [Category, number][])].sort((a, b) => a[1] - b[1])[0][0];

  const aheadPercent = Math.max(8, Math.min(96, Math.round(lifeScore * 0.8)));

  return {
    categories,
    lifeScore,
    aheadPercent,
    potentialScore,
    potentialUtilizationPercent,
    averagePossibleImprovement,
    strongestCategory,
    weakestCategory,
    opportunities: opportunities.slice(0, 3)
  };
}
