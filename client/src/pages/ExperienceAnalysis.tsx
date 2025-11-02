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
export default function ExperienceAnalysis() {
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
      if (result.errors && result.errors.length > 0) {
        toast.error(
          `Analyzed ${result.analyzed} experiences, but ${result.errors.length} failed. Skipped ${result.skipped} already analyzed.`,
          {
            description: result.errors.slice(0, 3).join('; ') + (result.errors.length > 3 ? '...' : ''),
            duration: 10000,
          }
        );
      } else {
        toast.success(`Analyzed ${result.analyzed} experiences! (Skipped ${result.skipped} already analyzed)`);
      }
      refetchAnalyses();
    },
    onError: (error) => {
      toast.error(`Batch analysis failed: ${error.message}`);
    },
  });

  const generateEmbeddingsMutation = trpc.experiences.generateEmbeddings.useMutation({
    onSuccess: (result) => {
      toast.success(`Generated ${result.generated} embeddings!`);
      refetchAnalyses();
    },
    onError: (error) => {
      toast.error(`Embedding generation failed: ${error.message}`);
    },
  });

  const clusterMutation = trpc.experiences.clusterAndIdentifyPatterns.useMutation({
    onSuccess: (result) => {
      toast.success(`Found ${result.totalClusters} clusters and ${result.totalPatterns} patterns!`);
      setPatterns(result.patterns);
      setClusters(result.clusters);
    },
    onError: (error) => {
      toast.error(`Clustering failed: ${error.message}`);
    },
  });

  const fixThemeEntriesMutation = trpc.experiences.fixThemeEntries.useMutation({
    onSuccess: (result) => {
      if (result.errors && result.errors.length > 0) {
        toast.error(
          `Fixed ${result.reanalyzed} entries, but ${result.errors.length} failed.`,
          {
            description: result.errors.slice(0, 3).join('; ') + (result.errors.length > 3 ? '...' : ''),
            duration: 10000,
          }
        );
      } else {
        toast.success(`Fixed ${result.reanalyzed} of ${result.total} entries with theme names!`);
      }
      // Refetch journal entries to show updated experienceType
      window.location.reload(); // Simple way to refresh all data
    },
    onError: (error) => {
      toast.error(`Fix failed: ${error.message}`);
    },
  });

  const [patterns, setPatterns] = useState<any[]>([]);
  const [clusters, setClusters] = useState<any[]>([]);
  const [selectedForCombination, setSelectedForCombination] = useState<number[]>([]);

  // Get combined experiences
  const { data: combinedExperiences, refetch: refetchCombined } = trpc.experiences.getCombinedExperiences.useQuery();

  // Combine experiences mutation
  const combineMutation = trpc.experiences.combineExperiences.useMutation({
    onSuccess: (result) => {
      toast.success(`Created "${result.name}"!`);
      setSelectedForCombination([]);
      refetchCombined();
    },
    onError: (error) => {
      toast.error(`Combination failed: ${error.message}`);
    },
  });

  // Update experience metadata mutation
  const reanalyzeMutation = trpc.experiences.reanalyzeThemeEntries.useMutation({
    onSuccess: (result) => {
      if (result.errors && result.errors.length > 0) {
        toast.error(
          `Re-analyzed ${result.reanalyzed} entries, but ${result.errors.length} failed.`,
          {
            description: result.errors.slice(0, 3).join('; ') + (result.errors.length > 3 ? '...' : ''),
            duration: 8000,
          }
        );
      } else {
        toast.success(`Re-analyzed ${result.reanalyzed} entries with proper experience types!`);
      }
      refetchAnalyses();
    },
    onError: (error) => {
      toast.error(`Re-analysis failed: ${error.message}`);
    },
  });

  const updateExperienceMutation = trpc.experiences.updateExperienceFromTheme.useMutation({
    onSuccess: (result) => {
      if (result.errors && result.errors.length > 0) {
        toast.error(
          `Updated ${result.updated} entries, but ${result.errors.length} failed.`,
          {
            description: result.errors.slice(0, 3).join('; ') + (result.errors.length > 3 ? '...' : ''),
            duration: 8000,
          }
        );
      } else {
        toast.success(`Updated Experience field for ${result.updated} entries!`);
      }
      setSelectedForCombination([]);
    },
    onError: (error) => {
      toast.error(`Update failed: ${error.message}`);
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
        <h1 className="text-3xl font-bold">Experience Analysis</h1>
        <p className="text-muted-foreground">
          Analyze your journal entries, find patterns, and combine similar experiences into wisdom insights
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
                <div className="flex gap-2">
                  <Button 
                    onClick={handleAnalyzeAll}
                    disabled={isAnalyzing}
                    size="lg"
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
                  <Button 
                    onClick={() => reanalyzeMutation.mutate()}
                    disabled={reanalyzeMutation.isPending}
                    size="lg"
                    variant="outline"
                  >
                    {reanalyzeMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Re-analyzing...
                      </>
                    ) : (
                      <>
                        <TrendingUp className="mr-2 h-4 w-4" />
                        Fix Theme Entries
                      </>
                    )}
                  </Button>
                </div>
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

      {/* Phase 2: Clustering & Patterns */}
      {stats && stats.analyzedEntries > 0 && (
        <Card className="border-purple-200 bg-purple-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              Phase 2: Semantic Clustering & Pattern Recognition
            </CardTitle>
            <CardDescription>
              Find similar experiences and identify recurring life patterns
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button
                onClick={() => generateEmbeddingsMutation.mutate()}
                disabled={generateEmbeddingsMutation.isPending}
                variant="outline"
              >
                {generateEmbeddingsMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Embeddings
                  </>
                )}
              </Button>
              <Button
                onClick={() => clusterMutation.mutate({ similarityThreshold: 0.75 })}
                disabled={clusterMutation.isPending}
                variant="default"
                className="bg-purple-600 hover:bg-purple-700"
              >
                {clusterMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Clustering...
                  </>
                ) : (
                  <>
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Find Patterns
                  </>
                )}
              </Button>
            </div>

            {/* Patterns Display */}
            {patterns.length > 0 && (
              <div className="space-y-3 mt-6">
                <h4 className="font-semibold text-sm">Discovered Patterns ({patterns.length})</h4>
                {patterns.map((pattern) => (
                  <Card key={pattern.patternId} className="bg-white">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">{pattern.name}</CardTitle>
                      <CardDescription className="text-xs">
                        {pattern.frequency} experiences • {pattern.themes.join(", ")}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground italic">"{pattern.insight}"</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {pattern.archetypes.map((arch: string, idx: number) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {arch}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Clusters Display */}
            {clusters.length > 0 && (
              <div className="space-y-2 mt-6">
                <h4 className="font-semibold text-sm">Experience Clusters ({clusters.length})</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {clusters.map((cluster) => {
                    // Check if this cluster's entries are all selected
                    const clusterEntryIds = analyses
                      ?.filter(a => a.primaryTheme === cluster.theme)
                      .map(a => a.entryId) || [];
                    const isClusterSelected = clusterEntryIds.length > 0 && 
                      clusterEntryIds.every(id => selectedForCombination.includes(id));
                    
                    return (
                      <Card 
                        key={cluster.id} 
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          isClusterSelected 
                            ? 'bg-purple-100 border-2 border-purple-500' 
                            : 'bg-white hover:bg-purple-50'
                        }`}
                        onClick={() => {
                          if (isClusterSelected) {
                            // Deselect all entries in this cluster
                            setSelectedForCombination(
                              selectedForCombination.filter(id => !clusterEntryIds.includes(id))
                            );
                          } else {
                            // Select all entries in this cluster
                            const newSelection = [...new Set([...selectedForCombination, ...clusterEntryIds])];
                            setSelectedForCombination(newSelection);
                          }
                        }}
                      >
                        <CardContent className="pt-4 pb-3">
                          <div className="text-lg font-bold text-purple-600">Cluster {cluster.id}</div>
                          <div className="text-xs text-muted-foreground">
                            {cluster.experienceCount} experiences
                          </div>
                          {cluster.theme && (
                            <Badge variant="outline" className="mt-2 text-xs">
                              {cluster.theme}
                            </Badge>
                          )}
                          {isClusterSelected && (
                            <div className="mt-2 text-xs font-medium text-purple-700">
                              ✓ Selected
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Phase 3: Experience Combination */}
      {stats && stats.analyzedEntries > 0 && (
        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
              Phase 3: Experience Combination
            </CardTitle>
            <CardDescription>
              Combine similar experiences to generate consolidated wisdom insights
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Selection Instructions */}
            <div className="bg-white p-4 rounded-lg border">
              <p className="text-sm text-muted-foreground">
                {selectedForCombination.length === 0 ? (
                  "Click cluster cards above or select individual entries below. Set Experience metadata from Theme, or combine 2+ entries for wisdom insights."
                ) : (
                  <span className="text-emerald-600 font-medium">
                    {selectedForCombination.length} experiences selected.
                  </span>
                )}
              </p>
              {selectedForCombination.length >= 1 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedForCombination.length >= 2 && (
                    <Button
                      onClick={() => combineMutation.mutate({ entryIds: selectedForCombination })}
                      disabled={combineMutation.isPending}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      {combineMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating Wisdom...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Combine Selected ({selectedForCombination.length})
                        </>
                      )}
                    </Button>
                  )}
                  <Button
                    onClick={() => updateExperienceMutation.mutate({ entryIds: selectedForCombination })}
                    disabled={updateExperienceMutation.isPending}
                    variant="default"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {updateExperienceMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <TrendingUp className="mr-2 h-4 w-4" />
                        Set Experience from Theme ({selectedForCombination.length})
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedForCombination([])}
                  >
                    Clear Selection
                  </Button>
                </div>
              )}
            </div>

            {/* Combined Experiences Display */}
            {combinedExperiences && combinedExperiences.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">Your Combined Wisdoms ({combinedExperiences.length})</h4>
                {combinedExperiences.map((combined) => (
                  <Card key={combined.id} className="bg-white border-emerald-200">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">{combined.name}</CardTitle>
                          <CardDescription className="text-xs mt-1">
                            {combined.entryCount} experiences • {combined.primaryTheme}
                          </CardDescription>
                        </div>
                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300">
                          Combined
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm italic text-muted-foreground mb-3">
                        "{combined.consolidatedWisdom}"
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {combined.archetypes.map((arch: string, idx: number) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {arch}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
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
                  <div className="flex items-start gap-3 flex-1">
                    {isAnalyzed && (
                      <input
                        type="checkbox"
                        checked={selectedForCombination.includes(entry.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedForCombination([...selectedForCombination, entry.id]);
                          } else {
                            setSelectedForCombination(selectedForCombination.filter(id => id !== entry.id));
                          }
                        }}
                        className="mt-1 h-5 w-5 rounded border-2 border-emerald-500 text-emerald-600 focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                      />
                    )}
                    <div className="flex-1">
                      <CardTitle className="text-lg">{entry.question}</CardTitle>
                      <CardDescription className="mt-2 line-clamp-2">
                        {entry.response}
                      </CardDescription>
                    </div>
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

