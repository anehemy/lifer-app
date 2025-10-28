import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [selectedFunction, setSelectedFunction] = useState<string | null>(null);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  // Using sonner toast

  const sendFeedbackMutation = trpc.feedback.send.useMutation({
    onSuccess: () => {
      toast.success("Feedback sent!", {
        description: "Thank you for helping us improve the Lifer App.",
      });
      // Reset form
      setSelectedArea(null);
      setSelectedFunction(null);
      setSelectedState(null);
      setMessage("");
    },
    onError: (error: any) => {
      toast.error("Failed to send feedback", {
        description: error.message,
      });
    },
  });

  // Generate message from selections
  const generateMessage = () => {
    const parts: string[] = [];
    
    if (selectedState) {
      parts.push(selectedState.toLowerCase());
    }
    
    if (selectedFunction) {
      parts.push(`the ${selectedFunction.toLowerCase()}`);
    }
    
    if (selectedArea) {
      parts.push(`in the ${selectedArea.toLowerCase()}`);
    }
    
    if (parts.length === 0) return "";
    
    // Capitalize first letter
    const generated = parts.join(" ");
    return generated.charAt(0).toUpperCase() + generated.slice(1);
  };

  const handleSelectionChange = () => {
    const generated = generateMessage();
    if (generated && !message) {
      setMessage(generated);
    }
  };

  const handleSend = () => {
    if (!message.trim()) {
      toast.error("Message required", {
        description: "Please write a message or select options to generate one.",
      });
      return;
    }

    sendFeedbackMutation.mutate({
      area: selectedArea || undefined,
      function: selectedFunction || undefined,
      state: selectedState || undefined,
      message: message.trim(),
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
          Help us improve! Select options to quickly compose your feedback.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Area Selection */}
        <div>
          <label className="text-sm font-medium mb-2 block">Area</label>
          <div className="flex flex-wrap gap-2">
            {AREA_OPTIONS.map((area) => (
              <Button
                key={area}
                variant={selectedArea === area ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setSelectedArea(area);
                  setTimeout(handleSelectionChange, 0);
                }}
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
                variant={selectedFunction === func ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setSelectedFunction(func);
                  setTimeout(handleSelectionChange, 0);
                }}
              >
                {func}
              </Button>
            ))}
          </div>
        </div>

        {/* State Selection */}
        <div>
          <label className="text-sm font-medium mb-2 block">State</label>
          <div className="flex flex-wrap gap-2">
            {STATE_OPTIONS.map((state) => (
              <Button
                key={state}
                variant={selectedState === state ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setSelectedState(state);
                  setTimeout(handleSelectionChange, 0);
                }}
              >
                {state}
              </Button>
            ))}
          </div>
        </div>

        {/* Message */}
        <div>
          <label className="text-sm font-medium mb-2 block">Your Message</label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe your feedback or let the buttons above generate a message..."
            rows={4}
            className="resize-none"
          />
        </div>

        {/* Send Button */}
        <Button
          onClick={handleSend}
          disabled={sendFeedbackMutation.isPending || !message.trim()}
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

