import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { MessageSquare, Loader2 } from "lucide-react";

const AREA_OPTIONS = [
  { label: "Chat", prefix: "the Chat" },
  { label: "Voice", prefix: "the Voice" },
  { label: "Journal", prefix: "the Journal" },
  { label: "Meditation", prefix: "Meditation" },
  { label: "Vision Board", prefix: "the Vision Board" },
  { label: "Patterns", prefix: "Patterns" },
  { label: "Primary Aim", prefix: "the Primary Aim" },
  { label: "Settings", prefix: "Settings" },
];

const FUNCTION_OPTIONS = [
  { label: "Navigation", text: "navigation" },
  { label: "Saving", text: "saving" },
  { label: "Loading", text: "loading" },
  { label: "Display", text: "display" },
  { label: "Performance", text: "performance" },
  { label: "Voice Quality", text: "voice quality" },
];

const STATE_OPTIONS = [
  { label: "worked better", text: "worked better" },
  { label: "was clearer", text: "was clearer" },
  { label: "was faster", text: "was faster" },
  { label: "was easier to use", text: "was easier to use" },
  { label: "had more features", text: "had more features" },
];

export function FeedbackWidget() {
  const [selectedArea, setSelectedArea] = useState<string>("");
  const [selectedFunction, setSelectedFunction] = useState<string>("");
  const [selectedState, setSelectedState] = useState<string>("");
  const [customMessage, setCustomMessage] = useState("");

  const sendFeedbackMutation = trpc.feedback.send.useMutation({
    onSuccess: () => {
      toast.success("Feedback sent!", {
        description: "Thank you for helping us improve the Lifer App.",
      });
      // Reset form
      setSelectedArea("");
      setSelectedFunction("");
      setSelectedState("");
      setCustomMessage("");
    },
    onError: (error: any) => {
      toast.error("Failed to send feedback", {
        description: error.message,
      });
    },
  });

  // Build the sentence preview
  const buildSentence = () => {
    const parts: string[] = ["Wouldn't it be nice if"];
    
    if (selectedArea) {
      const area = AREA_OPTIONS.find(a => a.label === selectedArea);
      parts.push(area?.prefix || selectedArea);
    }
    
    if (selectedFunction) {
      const func = FUNCTION_OPTIONS.find(f => f.label === selectedFunction);
      parts.push(func?.text || selectedFunction);
    }
    
    if (selectedState) {
      const state = STATE_OPTIONS.find(s => s.label === selectedState);
      parts.push(state?.text || selectedState);
    }
    
    if (parts.length === 1) return ""; // No selections yet
    return parts.join(" ") + "?";
  };

  const handleSend = () => {
    if (!selectedArea && !selectedFunction && !selectedState) {
      toast.error("Selection required", {
        description: "Please select at least one option to send feedback.",
      });
      return;
    }

    // Build message from sentence
    let message = buildSentence();
    
    // Add custom message if provided
    if (customMessage.trim()) {
      message += `\n\nAdditional details: ${customMessage.trim()}`;
    }

    sendFeedbackMutation.mutate({
      area: selectedArea || undefined,
      function: selectedFunction || undefined,
      state: selectedState || undefined,
      message,
    });
  };

  const sentence = buildSentence();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Quick Feedback
        </CardTitle>
        <CardDescription>
          Help us improve by completing this sentence
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Live Sentence Preview */}
        {sentence && (
          <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
            <p className="text-lg font-medium text-primary italic">
              {sentence}
            </p>
          </div>
        )}

        {/* Area Selection */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            Wouldn't it be nice if...
          </label>
          <div className="flex flex-wrap gap-2">
            {AREA_OPTIONS.map((area) => (
              <Button
                key={area.label}
                variant={selectedArea === area.label ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedArea(selectedArea === area.label ? "" : area.label)}
              >
                {area.prefix}
              </Button>
            ))}
          </div>
        </div>

        {/* Function Selection */}
        {selectedArea && (
          <div>
            <label className="text-sm font-medium mb-2 block">
              (optional) specify what aspect
            </label>
            <div className="flex flex-wrap gap-2">
              {FUNCTION_OPTIONS.map((func) => (
                <Button
                  key={func.label}
                  variant={selectedFunction === func.label ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedFunction(selectedFunction === func.label ? "" : func.label)}
                >
                  {func.text}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* State Selection */}
        {selectedArea && (
          <div>
            <label className="text-sm font-medium mb-2 block">
              (optional) how would you like it improved?
            </label>
            <div className="flex flex-wrap gap-2">
              {STATE_OPTIONS.map((state) => (
                <Button
                  key={state.label}
                  variant={selectedState === state.label ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedState(selectedState === state.label ? "" : state.label)}
                >
                  {state.text}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Optional Text Message */}
        {selectedArea && (
          <div>
            <label className="text-sm font-medium mb-2 block">Additional Details (optional)</label>
            <Textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Add any additional context or suggestions..."
              rows={3}
              className="resize-none"
            />
          </div>
        )}

        {/* Send Button */}
        <Button
          onClick={handleSend}
          disabled={sendFeedbackMutation.isPending || (!selectedArea && !selectedFunction && !selectedState)}
          className="w-full"
        >
          {sendFeedbackMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            "Send Feedback"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

