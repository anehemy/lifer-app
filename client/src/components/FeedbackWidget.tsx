import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { MessageSquare, Loader2 } from "lucide-react";

const AREA_OPTIONS = [
  "Chat",
  "Voice",
  "Journal",
  "Meditation",
  "Vision Board",
  "Patterns",
  "Primary Aim",
  "Settings",
  "Other",
];

const FUNCTION_OPTIONS = [
  "Navigation",
  "Saving",
  "Loading",
  "Display",
  "Performance",
  "Other",
];

const STATE_OPTIONS = [
  "Works well",
  "Doesn't work",
  "I don't like it",
  "Could be better",
  "Confusing",
];

export function FeedbackWidget() {
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [selectedFunctions, setSelectedFunctions] = useState<string[]>([]);
  const [selectedStates, setSelectedStates] = useState<string[]>([]);

  const sendFeedbackMutation = trpc.feedback.send.useMutation({
    onSuccess: () => {
      toast.success("Feedback sent!", {
        description: "Thank you for helping us improve the Lifer App.",
      });
      // Reset form
      setSelectedAreas([]);
      setSelectedFunctions([]);
      setSelectedStates([]);
    },
    onError: (error: any) => {
      toast.error("Failed to send feedback", {
        description: error.message,
      });
    },
  });

  const toggleSelection = (value: string, selected: string[], setSelected: (values: string[]) => void) => {
    if (selected.includes(value)) {
      setSelected(selected.filter(v => v !== value));
    } else {
      setSelected([...selected, value]);
    }
  };

  const handleSend = () => {
    if (selectedAreas.length === 0 && selectedFunctions.length === 0 && selectedStates.length === 0) {
      toast.error("Selection required", {
        description: "Please select at least one option to send feedback.",
      });
      return;
    }

    // Build simple message from selected button names
    const parts: string[] = [];
    if (selectedAreas.length > 0) parts.push(`Areas: ${selectedAreas.join(", ")}`);
    if (selectedFunctions.length > 0) parts.push(`Functions: ${selectedFunctions.join(", ")}`);
    if (selectedStates.length > 0) parts.push(`States: ${selectedStates.join(", ")}`);
    
    const message = parts.join(" | ");

    sendFeedbackMutation.mutate({
      area: selectedAreas.join(", ") || undefined,
      function: selectedFunctions.join(", ") || undefined,
      state: selectedStates.join(", ") || undefined,
      message,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Quick Feedback
        </CardTitle>
        <CardDescription>
          Select one or more options in each category, then click Send.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Area Selection */}
        <div>
          <label className="text-sm font-medium mb-2 block">Area (select all that apply)</label>
          <div className="flex flex-wrap gap-2">
            {AREA_OPTIONS.map((area) => (
              <Button
                key={area}
                variant={selectedAreas.includes(area) ? "default" : "outline"}
                size="sm"
                onClick={() => toggleSelection(area, selectedAreas, setSelectedAreas)}
              >
                {area}
              </Button>
            ))}
          </div>
        </div>

        {/* Function Selection */}
        <div>
          <label className="text-sm font-medium mb-2 block">Function (optional)</label>
          <div className="flex flex-wrap gap-2">
            {FUNCTION_OPTIONS.map((func) => (
              <Button
                key={func}
                variant={selectedFunctions.includes(func) ? "default" : "outline"}
                size="sm"
                onClick={() => toggleSelection(func, selectedFunctions, setSelectedFunctions)}
              >
                {func}
              </Button>
            ))}
          </div>
        </div>

        {/* State Selection */}
        <div>
          <label className="text-sm font-medium mb-2 block">State (select all that apply)</label>
          <div className="flex flex-wrap gap-2">
            {STATE_OPTIONS.map((state) => (
              <Button
                key={state}
                variant={selectedStates.includes(state) ? "default" : "outline"}
                size="sm"
                onClick={() => toggleSelection(state, selectedStates, setSelectedStates)}
              >
                {state}
              </Button>
            ))}
          </div>
        </div>

        {/* Send Button */}
        <Button
          onClick={handleSend}
          disabled={sendFeedbackMutation.isPending || (selectedAreas.length === 0 && selectedFunctions.length === 0 && selectedStates.length === 0)}
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

