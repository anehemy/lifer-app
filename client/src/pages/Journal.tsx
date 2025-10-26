import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import JournalEntryCard from "@/components/JournalEntryCard";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { MR_MG_AVATAR, MR_MG_NAME } from "@/const";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Trash2, RefreshCw, Mic, MicOff, MessageCircle, Send } from "lucide-react";
import LifeStoryTimeline from "@/components/LifeStoryTimeline";

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
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  // Removed custom Mr. MG chat - now using global AIChatWidget
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<number | null>(null);
  const [deletedEntry, setDeletedEntry] = useState<{id: number, question: string, response: string} | null>(null);
  const [undoTimeoutId, setUndoTimeoutId] = useState<NodeJS.Timeout | null>(null);
  
  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';
      
      recognitionInstance.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }
        
        if (finalTranscript) {
          setResponse(prev => prev + finalTranscript);
        }
      };
      
      recognitionInstance.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        if (event.error !== 'no-speech') {
          toast.error('Voice recognition error: ' + event.error);
        }
      };
      
      recognitionInstance.onend = () => {
        setIsRecording(false);
      };
      
      setRecognition(recognitionInstance);
    }
  }, []);
  
  const toggleRecording = () => {
    if (!recognition) {
      toast.error('Voice input not supported in this browser');
      return;
    }
    
    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
    } else {
      recognition.start();
      setIsRecording(true);
      toast.info('Listening... Speak your response');
    }
  };
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
      utils.journal.list.invalidate();
      utils.patterns.analyze.invalidate();
    },
  });
  
  const handleDeleteClick = (id: number) => {
    setEntryToDelete(id);
    setDeleteConfirmOpen(true);
  };
  
  const handleDeleteConfirm = () => {
    if (!entryToDelete) return;
    
    // Find the entry to store for undo
    const entry = entries.find(e => e.id === entryToDelete);
    if (entry) {
      setDeletedEntry({ id: entry.id, question: entry.question, response: entry.response });
      
      // Clear any existing undo timeout
      if (undoTimeoutId) {
        clearTimeout(undoTimeoutId);
      }
      
      // Set 10-second undo window
      const timeoutId = setTimeout(() => {
        setDeletedEntry(null);
      }, 10000);
      setUndoTimeoutId(timeoutId);
      
      // Delete the entry
      deleteEntry.mutate({ id: entryToDelete });
      
      // Show undo toast
      toast.success("Entry deleted", {
        action: {
          label: "Undo",
          onClick: handleUndo,
        },
        duration: 10000,
      });
    }
    
    setDeleteConfirmOpen(false);
    setEntryToDelete(null);
  };
  
  const handleUndo = () => {
    if (!deletedEntry) return;
    
    // Clear the undo timeout
    if (undoTimeoutId) {
      clearTimeout(undoTimeoutId);
      setUndoTimeoutId(null);
    }
    
    // Recreate the entry
    createEntry.mutate({
      question: deletedEntry.question,
      response: deletedEntry.response,
    });
    
    setDeletedEntry(null);
    toast.success("Entry restored");
  };
  
  // askMrMg mutation removed - now using global AIChatWidget

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
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-4xl bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-800 dark:to-purple-900">
              {MR_MG_AVATAR}
            </div>
            <div className="flex-1">
              <CardTitle className="mb-2">{MR_MG_NAME} asks:</CardTitle>
              <p className="text-lg">{currentQuestion}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={handleNextQuestion} variant="outline" size="sm" className="flex-1 min-w-[140px]">
              <RefreshCw className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Ask Another Question</span>
              <span className="sm:hidden">New Question</span>
            </Button>
            <Button onClick={() => window.dispatchEvent(new Event('openMrMgChat'))} variant="default" size="sm" className="flex-1 min-w-[140px]">
              <MessageCircle className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Ask Mr. MG for Guidance</span>
              <span className="sm:hidden">Ask Mr. MG</span>
            </Button>
          </div>
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

      {/* Timeline Visualization */}
      {entries.length > 0 && (
        <LifeStoryTimeline entries={entries} />
      )}
      
      {/* Previous Entries - Simple List */}
      {entries.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">All Entries</h2>
          <div className="space-y-4">
            {entries.map((entry) => (
              <JournalEntryCard
                key={entry.id}
                entry={entry}
                onDelete={() => handleDeleteClick(entry.id)}
              />
            ))}
          </div>
        </div>
      )}
      
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Journal Entry?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this entry? You'll have 10 seconds to undo this action.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
