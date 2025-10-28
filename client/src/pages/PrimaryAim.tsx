import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MR_MG_AVATAR, MR_MG_NAME } from "@/const";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Sparkles, Loader2, Lightbulb } from "lucide-react";
import { useAnalytics, EventType, usePageView } from "@/hooks/useAnalytics";

const sections = [
  { key: "personal", label: "Personal Identity", prompt: "Who do you want to be as a person? What character traits define your ideal self?", icon: "👤" },
  { key: "relationships", label: "Relationships", prompt: "How do you want to show up in your relationships? What kind of partner, parent, friend do you want to be?", icon: "❤️" },
  { key: "contribution", label: "Contribution/Work", prompt: "What impact do you want to make in the world? How do you want to contribute?", icon: "🌍" },
  { key: "health", label: "Health & Vitality", prompt: "How do you want to feel in your body? What does physical and mental wellness mean to you?", icon: "💪" },
  { key: "growth", label: "Growth & Learning", prompt: "What do you want to learn? How do you want to grow throughout your life?", icon: "📚" },
  { key: "legacy", label: "Legacy", prompt: "When you're gone, what do you want people to say about how you lived?", icon: "⭐" },
];

export default function PrimaryAim() {
  usePageView("/primary-aim");
  const { logEvent } = useAnalytics();
  const { data: aim } = trpc.primaryAim.get.useQuery();
  const utils = trpc.useUtils();
  
  const [values, setValues] = useState<Record<string, string>>({
    statement: "",
    personal: "",
    relationships: "",
    contribution: "",
    health: "",
    growth: "",
    legacy: "",
  });
  
  const [suggestingFor, setSuggestingFor] = useState<string | null>(null);

  useEffect(() => {
    if (aim) {
      setValues({
        statement: aim.statement || "",
        personal: aim.personal || "",
        relationships: aim.relationships || "",
        contribution: aim.contribution || "",
        health: aim.health || "",
        growth: aim.growth || "",
        legacy: aim.legacy || "",
      });
    }
  }, [aim]);

  const upsertAim = trpc.primaryAim.upsert.useMutation({
    onSuccess: () => {
      toast.success("Primary Aim saved!");
      logEvent(EventType.PRIMARY_AIM_UPDATED);
      utils.primaryAim.get.invalidate();
    },
  });

  const generateStatement = trpc.primaryAim.generateStatement.useMutation({
    onSuccess: (data) => {
      setValues({ ...values, statement: data.statement });
      toast.success("AI has crafted your Primary Aim Statement!");
    },
    onError: (error) => {
      toast.error("Failed to generate statement: " + error.message);
    },
  });
  
  const suggestSection = trpc.primaryAim.suggestSection.useMutation({
    onSuccess: (data) => {
      const suggestion = typeof data.suggestion === 'string' ? data.suggestion : '';
      setValues((prev) => ({ ...prev, [data.section]: suggestion }));
      toast.success("AI suggestion added!");
      setSuggestingFor(null);
    },
    onError: (error) => {
      toast.error("Failed to generate suggestion: " + error.message);
      setSuggestingFor(null);
    },
  });

  const handleSave = () => {
    upsertAim.mutate(values);
  };

  const handleGenerateStatement = () => {
    const filledSections = sections.filter(s => values[s.key]?.trim());
    if (filledSections.length === 0) {
      toast.error("Please fill out at least one section before generating your Primary Aim Statement");
      return;
    }
    generateStatement.mutate(values);
  };
  
  const handleSuggest = (sectionKey: string) => {
    setSuggestingFor(sectionKey);
    suggestSection.mutate({ section: sectionKey });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-4xl font-bold mb-2">Your Primary Aim</h1>
        <p className="text-muted-foreground">Life's Deeper Purpose</p>
      </div>

      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="text-4xl">{MR_MG_AVATAR}</div>
            <div>
              <CardTitle className="mb-2">{MR_MG_NAME} explains:</CardTitle>
              <p className="text-lg">
                Your Primary Aim isn't about what you do for work—it's about who you ARE and how you want to LIVE. 
                It's the vision that gives everything else meaning. Let's discover yours together.
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* 6 Reflection Sections in 2-column grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map((section) => (
          <Card key={section.key} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{section.icon}</span>
                  <CardTitle className="text-lg">{section.label}</CardTitle>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleSuggest(section.key)}
                  disabled={suggestingFor === section.key}
                  className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                >
                  {suggestingFor === section.key ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Lightbulb className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">{section.prompt}</p>
            </CardHeader>
            <CardContent>
              <Textarea
                value={values[section.key]}
                onChange={(e) => setValues({ ...values, [section.key]: e.target.value })}
                placeholder={`Reflect on your ${section.label.toLowerCase()}...`}
                className="min-h-[120px] resize-none"
              />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Primary Aim Statement */}
      <Card className="border-2 border-purple-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">Your Primary Aim Statement</CardTitle>
            <Button
              onClick={handleGenerateStatement}
              disabled={generateStatement.isPending}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {generateStatement.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate with AI
                </>
              )}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Based on your reflections above, this is your synthesized Primary Aim—answering WHO you are and WHAT you want.
          </p>
        </CardHeader>
        <CardContent>
          <Textarea
            value={values.statement}
            onChange={(e) => setValues({ ...values, statement: e.target.value })}
            placeholder="Your Primary Aim Statement will appear here after you generate it with AI, or you can write your own..."
            className="min-h-[200px] text-lg leading-relaxed"
          />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button
          onClick={handleSave}
          disabled={upsertAim.isPending}
          size="lg"
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          {upsertAim.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Primary Aim"
          )}
        </Button>
      </div>
    </div>
  );
}
