import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MR_MG_AVATAR, MR_MG_NAME } from "@/const";
import { useState, useEffect } from "react";
import { toast } from "sonner";

const sections = [
  { key: "personal", label: "Personal Identity", prompt: "Who do you want to be as a person? What character traits define your ideal self?" },
  { key: "relationships", label: "Relationships", prompt: "How do you want to show up in your relationships? What kind of partner, parent, friend do you want to be?" },
  { key: "contribution", label: "Contribution/Work", prompt: "What impact do you want to make in the world? How do you want to contribute?" },
  { key: "health", label: "Health & Vitality", prompt: "How do you want to feel in your body? What does physical and mental wellness mean to you?" },
  { key: "growth", label: "Growth & Learning", prompt: "What do you want to learn? How do you want to grow throughout your life?" },
  { key: "legacy", label: "Legacy", prompt: "When you're gone, what do you want people to say about how you lived?" },
];

export default function PrimaryAim() {
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
      utils.primaryAim.get.invalidate();
    },
  });

  const handleSave = () => {
    upsertAim.mutate(values);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
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

      <div className="space-y-6">
        {sections.map((section) => (
          <Card key={section.key}>
            <CardHeader>
              <CardTitle>{section.label}</CardTitle>
              <p className="text-sm text-muted-foreground">{section.prompt}</p>
            </CardHeader>
            <CardContent>
              <Textarea
                value={values[section.key] || ""}
                onChange={(e) => setValues({ ...values, [section.key]: e.target.value })}
                placeholder="Share your thoughts..."
                className="min-h-[120px]"
              />
            </CardContent>
          </Card>
        ))}

        <Card>
          <CardHeader>
            <CardTitle>Primary Aim Statement</CardTitle>
            <p className="text-sm text-muted-foreground">
              Synthesize your reflections into a Primary Aim Statement (2-3 paragraphs describing the life you want to live)
            </p>
          </CardHeader>
          <CardContent>
            <Textarea
              value={values.statement || ""}
              onChange={(e) => setValues({ ...values, statement: e.target.value })}
              placeholder="My Primary Aim is to..."
              className="min-h-[200px]"
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          {aim && (
            <p className="text-sm text-muted-foreground self-center">
              Last updated: {new Date(aim.updatedAt).toLocaleDateString()}
            </p>
          )}
          <Button onClick={handleSave} size="lg" disabled={upsertAim.isPending}>
            {upsertAim.isPending ? "Saving..." : "Save Primary Aim"}
          </Button>
        </div>
      </div>
    </div>
  );
}
