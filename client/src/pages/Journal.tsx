import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MR_MG_AVATAR, MR_MG_NAME } from "@/const";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Trash2, RefreshCw } from "lucide-react";

const questions = [
  "Tell me about a moment in your childhood that shaped who you are today.",
  "What beliefs about success, money, and work did you learn from your family?",
  "Think about a time when you felt most alive and authentic. What were you doing?",
  "When you look at your biggest struggles, what have they taught you?",
  "Imagine you're 90 years old. What would make you feel you truly lived?",
  "If you could only be remembered for one thing, what would it be?",
  "When you strip away what others expect, what do YOU actually want?",
  "What would you do if you knew you couldn't fail?",
  "What gives your life the deepest sense of meaning?",
  "What patterns do you notice when you look back on your life?",
];

export default function Journal() {
  const [currentQuestion, setCurrentQuestion] = useState(questions[0]);
  const [response, setResponse] = useState("");
  const utils = trpc.useUtils();
  
  const { data: entries = [] } = trpc.journal.list.useQuery();
  const createEntry = trpc.journal.create.useMutation({
    onSuccess: () => {
      toast.success("Entry saved successfully!");
      setResponse("");
      utils.journal.list.invalidate();
      utils.patterns.analyze.invalidate();
    },
  });
  const deleteEntry = trpc.journal.delete.useMutation({
    onSuccess: () => {
      toast.success("Entry deleted");
      utils.journal.list.invalidate();
      utils.patterns.analyze.invalidate();
    },
  });

  const handleNextQuestion = () => {
    const currentIndex = questions.indexOf(currentQuestion);
    const nextIndex = (currentIndex + 1) % questions.length;
    setCurrentQuestion(questions[nextIndex]);
  };

  const handleSave = () => {
    if (!response.trim()) {
      toast.error("Please write something before saving");
      return;
    }
    createEntry.mutate({ question: currentQuestion, response });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-4xl font-bold mb-2">Your Life Story</h1>
        <p className="text-muted-foreground">Guided by {MR_MG_NAME}</p>
      </div>

      {/* Mr. MG Question Card */}
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="text-4xl">{MR_MG_AVATAR}</div>
            <div className="flex-1">
              <CardTitle className="mb-2">{MR_MG_NAME} asks:</CardTitle>
              <p className="text-lg">{currentQuestion}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Button onClick={handleNextQuestion} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Ask Another Question
          </Button>
        </CardContent>
      </Card>

      {/* Journal Entry Area */}
      <Card>
        <CardHeader>
          <CardTitle>Your Response</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder="Share your thoughts with Mr. MG... Take your time and let your reflections flow freely."
            className="min-h-[200px] text-base"
          />
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              {response.length} characters
            </span>
            <Button onClick={handleSave} disabled={createEntry.isPending}>
              {createEntry.isPending ? "Saving..." : "Save Entry"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Previous Entries */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Previous Entries</h2>
        {entries.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              Your journal entries will appear here as you write them.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {entries.map((entry) => (
              <Card key={entry.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground mb-2">
                        {new Date(entry.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                      <p className="font-medium text-purple-600 dark:text-purple-400 mb-2">
                        {entry.question}
                      </p>
                      <p className="text-base whitespace-pre-wrap">{entry.response}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteEntry.mutate({ id: entry.id })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
