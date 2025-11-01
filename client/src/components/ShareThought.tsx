import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Sparkles, Check, X, Edit3 } from "lucide-react";
import { toast } from "sonner";

interface ShareThoughtProps {
  onSuccess?: () => void;
  compact?: boolean; // For dashboard vs full-page view
}

export default function ShareThought({ onSuccess, compact = false }: ShareThoughtProps) {
  const [thought, setThought] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [autoApprove, setAutoApprove] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const utils = trpc.useUtils();
  const { data: user } = trpc.auth.me.useQuery();

  const analyzeThought = trpc.journal.analyzeThought.useMutation({
    onSuccess: (data) => {
      setAnalysis(data);
      setIsAnalyzing(false);
      
      // If user has auto-approve enabled, save immediately
      if (user?.autoApproveThoughts) {
        handleApprove(true);
      }
    },
    onError: (error) => {
      toast.error("Failed to analyze thought");
      console.error(error);
      setIsAnalyzing(false);
    },
  });

  const saveThought = trpc.journal.saveThought.useMutation({
    onSuccess: () => {
      toast.success("Thought saved to your journal!");
      setThought("");
      setAnalysis(null);
      setAutoApprove(false);
      utils.journal.list.invalidate();
      utils.journal.getStats.invalidate();
      onSuccess?.();
    },
    onError: (error) => {
      toast.error("Failed to save thought");
      console.error(error);
    },
  });

  const handleSubmit = () => {
    if (!thought.trim()) {
      toast.error("Please share a thought first");
      return;
    }

    setIsAnalyzing(true);
    analyzeThought.mutate({ thought: thought.trim() });
  };

  const handleApprove = (skipToast = false) => {
    if (!analysis) return;

    saveThought.mutate({
      question: analysis.question,
      response: analysis.response,
      timeContext: analysis.timeContext,
      placeContext: analysis.placeContext,
      experienceType: analysis.experienceType,
      challengeType: analysis.challengeType,
      growthTheme: analysis.growthTheme,
      autoApprove: autoApprove,
    });

    if (!skipToast) {
      toast.success(analysis.acknowledgment || "Thank you for sharing!");
    }
  };

  const handleReject = () => {
    setAnalysis(null);
    setIsAnalyzing(false);
    toast.info("Let's try again");
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    setIsEditing(false);
    toast.success("Changes saved");
  };

  // If user has auto-approve and we're analyzing, show minimal feedback
  if (isAnalyzing && user?.autoApproveThoughts) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Saving your thought...</span>
        </div>
      </Card>
    );
  }

  // Show review card if analysis is complete
  if (analysis && !user?.autoApproveThoughts) {
    return (
      <Card className="p-6 space-y-4">
        {/* Mr. MG's acknowledgment */}
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground italic">
              {analysis.acknowledgment}
            </p>
          </div>
        </div>

        {/* Proposed entry */}
        <div className="space-y-3 border-l-2 border-purple-200 dark:border-purple-800 pl-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Question</label>
            {isEditing ? (
              <Textarea
                value={analysis.question}
                onChange={(e) => setAnalysis({ ...analysis, question: e.target.value })}
                className="mt-1"
              />
            ) : (
              <p className="text-sm font-medium mt-1">{analysis.question}</p>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Your Response</label>
            {isEditing ? (
              <Textarea
                value={analysis.response}
                onChange={(e) => setAnalysis({ ...analysis, response: e.target.value })}
                className="mt-1"
                rows={3}
              />
            ) : (
              <p className="text-sm mt-1">{analysis.response}</p>
            )}
          </div>

          {/* Metadata tags */}
          <div className="flex flex-wrap gap-2 mt-3">
            {analysis.timeContext && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">
                🕐 {analysis.timeContext}
              </span>
            )}
            {analysis.placeContext && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300">
                📍 {analysis.placeContext}
              </span>
            )}
            {analysis.experienceType && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300">
                ✨ {analysis.experienceType}
              </span>
            )}
            {analysis.challengeType && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300">
                ❤️ {analysis.challengeType}
              </span>
            )}
            {analysis.growthTheme && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300">
                🌱 {analysis.growthTheme}
              </span>
            )}
          </div>
        </div>

        {/* Auto-approve checkbox */}
        <div className="flex items-center gap-2 pt-2">
          <Checkbox
            id="auto-approve"
            checked={autoApprove}
            onCheckedChange={(checked) => setAutoApprove(checked as boolean)}
          />
          <label
            htmlFor="auto-approve"
            className="text-sm text-muted-foreground cursor-pointer"
          >
            Always auto-approve my thoughts (skip this review step)
          </label>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 pt-2">
          {isEditing ? (
            <Button onClick={handleSaveEdit} className="flex-1">
              <Check className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          ) : (
            <>
              <Button onClick={handleApprove} className="flex-1" disabled={saveThought.isPending}>
                {saveThought.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                Approve & Save
              </Button>
              <Button onClick={handleEdit} variant="outline">
                <Edit3 className="h-4 w-4" />
              </Button>
              <Button onClick={handleReject} variant="outline">
                <X className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </Card>
    );
  }

  // Input form
  return (
    <Card className={compact ? "p-4" : "p-6"}>
      <div className="space-y-4">
        {/* Header with Mr. MG avatar */}
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className={compact ? "text-base font-semibold" : "text-lg font-semibold"}>
              Share a Thought
            </h3>
            <p className="text-sm text-muted-foreground">
              What's on your mind? I'll help you capture it.
            </p>
          </div>
        </div>

        {/* Input */}
        <Textarea
          placeholder="Type anything that's on your mind... a memory, insight, feeling, or experience you want to remember."
          value={thought}
          onChange={(e) => setThought(e.target.value)}
          rows={compact ? 3 : 5}
          className="resize-none"
        />

        {/* Submit button */}
        <Button
          onClick={handleSubmit}
          disabled={!thought.trim() || isAnalyzing}
          className="w-full"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Share with Mr. MG
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}

