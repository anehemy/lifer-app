import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

/**
 * Simple test UI for Phase 1: Experience Analysis
 * No bubble visualization yet - just table view to verify AI works
 */
export default function ExperiencesTest() {
  const [selectedEntryId, setSelectedEntryId] = useState<number | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Get all journal entries
  const { data: entries, isLoading: entriesLoading } = trpc.journal.list.useQuery();
  
  // Get all analyses
  const { data: analyses, refetch: refetchAnalyses } = trpc.experiences.getAllAnalyses.useQuery();
  
  // Get stats
  const { data: stats } = trpc.experiences.getStats.useQuery();

  // Mutations
  const analyzeMutation = trpc.experiences.analyze.useMutation({
    onSuccess: () => {
      toast.success("Experience analyzed!");
      refetchAnalyses();
    },
    onError: (error) => {
      toast.error(`Analysis failed: ${error.message}`);
    },
  });

  const analyzeAllMutation = trpc.experiences.analyzeAll.useMutation({
    onSuccess: (result) => {
      toast.success(`Analyzed ${result.analyzed} experiences! (Skipped ${result.skipped} already analyzed)`);
      refetchAnalyses();
    },
    onError: (error) => {
      toast.error(`Batch analysis failed: ${error.message}`);
    },
  });

  const handleAnalyze = async (entryId: number) => {
    setIsAnalyzing(true);
    setSelectedEntryId(entryId);
    try {
      await analyzeMutation.mutateAsync({ entryId });
    } finally {
      setIsAnalyzing(false);
      setSelectedEntryId(null);
    }
  };

  const handleAnalyzeAll = async () => {
    if (!confirm("This will analyze all your journal entries. Continue?")) return;
    setIsAnalyzing(true);
    try {
      await analyzeAllMutation.mutateAsync();
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Get analysis for entry
  const getAnalysisForEntry = (entryId: number) => {
    return analyses?.find(a => a.entryId === entryId);
  };

  // Theme colors
  const themeColors: Record<string, string> = {
    Love: "bg-pink-100 text-pink-800 border-pink-300",
    Value: "bg-blue-100 text-blue-800 border-blue-300",
    Power: "bg-red-100 text-red-800 border-red-300",
    Freedom: "bg-green-100 text-green-800 border-green-300",
    Truth: "bg-purple-100 text-purple-800 border-purple-300",
    Justice: "bg-orange-100 text-orange-800 border-orange-300",
  };

  if (entriesLoading) {
    return (
      <div className="container mx-auto py-8 flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Experience Analysis Test</h1>
        <p className="text-muted-foreground">
          Phase 1: AI-powered psychological dimension extraction (no bubble visualization yet)
        </p>
      </div>

      {/* Stats Card */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Analysis Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-2xl font-bold">{stats.totalEntries}</div>
                <div className="text-sm text-muted-foreground">Total Entries</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.analyzedEntries}</div>
                <div className="text-sm text-muted-foreground">Analyzed</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{Math.round(stats.percentageAnalyzed)}%</div>
                <div className="text-sm text-muted-foreground">Progress</div>
              </div>
              <div>
                <Button 
                  onClick={handleAnalyzeAll}
                  disabled={isAnalyzing || stats.percentageAnalyzed === 100}
                  className="w-full"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Analyze All
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Theme Distribution */}
            {Object.keys(stats.themeDistribution).length > 0 && (
              <div className="mt-6 space-y-2">
                <h4 className="font-semibold text-sm">Theme Distribution</h4>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(stats.themeDistribution).map(([theme, count]) => (
                    <Badge 
                      key={theme} 
                      variant="outline"
                      className={themeColors[theme] || ""}
                    >
                      {theme}: {count}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Average Dimensions */}
            <div className="mt-6 grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="font-semibold">Avg Impact</div>
                <div className="text-2xl font-bold text-primary">{stats.averages.impact}/10</div>
              </div>
              <div>
                <div className="font-semibold">Avg Challenge</div>
                <div className="text-2xl font-bold text-primary">{stats.averages.challenge}/10</div>
              </div>
              <div>
                <div className="font-semibold">Avg Worldview Change</div>
                <div className="text-2xl font-bold text-primary">{stats.averages.worldviewChange}/10</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Entries List */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Journal Entries</h2>
        
        {entries && entries.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No journal entries yet. Go to Life Story to create some!
            </CardContent>
          </Card>
        )}

        {entries?.map((entry) => {
          const analysis = getAnalysisForEntry(entry.id);
          const isAnalyzed = !!analysis;

          return (
            <Card key={entry.id} className={isAnalyzed ? "border-green-200" : ""}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{entry.question}</CardTitle>
                    <CardDescription className="mt-2 line-clamp-2">
                      {entry.response}
                    </CardDescription>
                  </div>
                  <div className="ml-4">
                    {isAnalyzed ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Analyzed
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleAnalyze(entry.id)}
                        disabled={isAnalyzing && selectedEntryId === entry.id}
                      >
                        {isAnalyzing && selectedEntryId === entry.id ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <Sparkles className="mr-2 h-4 w-4" />
                            Analyze
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>

              {/* Show analysis if available */}
              {analysis && (
                <CardContent className="space-y-4 border-t pt-4">
                  {/* Primary Theme */}
                  <div>
                    <div className="text-sm font-semibold mb-2">Primary Theme</div>
                    <Badge className={themeColors[analysis.primaryTheme!] || ""}>
                      {analysis.primaryTheme}
                    </Badge>
                  </div>

                  {/* Experience Archetype */}
                  <div>
                    <div className="text-sm font-semibold mb-2">Experience Archetype</div>
                    <div className="text-sm">{analysis.experienceArchetype}</div>
                  </div>

                  {/* ECQ Dimensions */}
                  <div>
                    <div className="text-sm font-semibold mb-2">Psychological Dimensions</div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                      <div>
                        <div className="text-muted-foreground">Valence</div>
                        <div className="font-medium capitalize">{analysis.valence}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Impact</div>
                        <div className="font-medium">{analysis.impact}/10</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Challenge</div>
                        <div className="font-medium">{analysis.challenge}/10</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Emotional Significance</div>
                        <div className="font-medium">{analysis.emotionalSignificance}/10</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Predictability</div>
                        <div className="font-medium">{analysis.predictability}/10</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Worldview Change</div>
                        <div className="font-medium">{analysis.worldviewChange}/10</div>
                      </div>
                    </div>
                  </div>

                  {/* Keywords */}
                  {analysis.keywords && analysis.keywords.length > 0 && (
                    <div>
                      <div className="text-sm font-semibold mb-2">Keywords</div>
                      <div className="flex flex-wrap gap-2">
                        {analysis.keywords.map((keyword, idx) => (
                          <Badge key={idx} variant="secondary">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Emotional Tone */}
                  <div>
                    <div className="text-sm font-semibold mb-2">Emotional Tone</div>
                    <div className="text-sm capitalize">{analysis.emotionalTone}</div>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

