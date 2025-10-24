import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MR_MG_AVATAR, MR_MG_NAME } from "@/const";
import { Brain, TrendingUp, Heart, Lightbulb, Target } from "lucide-react";

export default function Patterns() {
  const { data: patterns = [], isLoading } = trpc.patterns.analyze.useQuery();
  const { data: entries = [] } = trpc.journal.list.useQuery();

  const categoryIcons: Record<string, any> = {
    strengths: TrendingUp,
    challenges: Brain,
    relationships: Heart,
    growth: Lightbulb,
    purpose: Target,
  };

  const categoryColors: Record<string, string> = {
    strengths: "from-green-500 to-emerald-500",
    challenges: "from-orange-500 to-red-500",
    relationships: "from-pink-500 to-rose-500",
    growth: "from-blue-500 to-cyan-500",
    purpose: "from-purple-500 to-indigo-500",
  };

  const categoryInsights: Record<string, string> = {
    strengths: "I notice resilience appearing throughout your story. These are your core strengths.",
    challenges: "You've faced significant challenges, but notice how each time you've grown stronger.",
    relationships: "Connection with others seems central to who you are.",
    growth: "You're drawn to personal development and continuous learning.",
    purpose: "Your sense of purpose is emerging. You want to make a meaningful contribution.",
  };

  const groupedPatterns = patterns.reduce((acc, pattern) => {
    if (!acc[pattern.category]) {
      acc[pattern.category] = [];
    }
    acc[pattern.category].push(pattern);
    return acc;
  }, {} as Record<string, typeof patterns>);

  if (entries.length === 0) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold">Pattern Insights</h1>
        <Card>
          <CardContent className="pt-6 text-center">
            <Brain className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground">
              Start journaling with {MR_MG_NAME} to discover patterns in your story
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-4xl font-bold mb-2">Discovering Your Patterns</h1>
        <p className="text-muted-foreground">{MR_MG_NAME}'s Analysis</p>
      </div>

      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="text-4xl">{MR_MG_AVATAR}</div>
            <div>
              <CardTitle className="mb-2">{MR_MG_NAME} says:</CardTitle>
              <p className="text-lg">
                Let me share what I'm seeing in your story. I've analyzed {entries.length} journal{" "}
                {entries.length === 1 ? "entry" : "entries"} and discovered {patterns.length} meaningful patterns.
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {Object.entries(groupedPatterns).map(([category, categoryPatterns]) => {
        const Icon = categoryIcons[category] || Brain;
        const color = categoryColors[category] || "from-gray-500 to-gray-600";
        const insight = categoryInsights[category] || "";

        return (
          <Card key={category}>
            <CardHeader>
              <div className="flex items-center gap-3 mb-4">
                <div className={`h-12 w-12 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="capitalize">{category} Pattern</CardTitle>
              </div>
              {insight && (
                <p className="text-muted-foreground italic">"{insight}"</p>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {categoryPatterns.map((pattern, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                    <div>
                      <span className="font-medium capitalize">{pattern.theme}</span>
                      <p className="text-sm text-muted-foreground">
                        Appeared in {pattern.count} {pattern.count === 1 ? "entry" : "entries"}
                      </p>
                    </div>
                    <div className="text-2xl font-bold text-primary">{pattern.count}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
