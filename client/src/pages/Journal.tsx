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
import { Trash2, RefreshCw, Mic, MicOff, MessageCircle, Send, Sparkles, Search, ChevronDown, ChevronUp } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import LifeStoryTimeline from "@/components/LifeStoryTimeline";
import { useAnalytics, EventType, usePageView } from "@/hooks/useAnalytics";
import { useAuth } from "@/_core/hooks/useAuth";

// Template questions organized by theme
const TEMPLATE_QUESTIONS = [
  // Childhood & Early Life
  "What is your earliest childhood memory?",
  "Who was the most influential person in your childhood, and why?",
  "What was your favorite place as a child?",
  
  // Turning Points
  "Describe a moment that changed the direction of your life.",
  "What decision are you most proud of making?",
  "What was the hardest choice you've ever had to make?",
  
  // Relationships
  "Who has had the greatest impact on who you are today?",
  "Describe a relationship that taught you something important about yourself.",
  "What does love mean to you?",
  
  // Challenges & Growth
  "What challenge helped you discover your inner strength?",
  "Describe a time when you failed and what you learned from it.",
  "What fear have you overcome, and how did you do it?",
  
  // Values & Purpose
  "What do you value most in life?",
  "If you could give your younger self one piece of advice, what would it be?",
  "What legacy do you want to leave behind?",
  
  // Present & Future
  "What are you most grateful for right now?",
  "What dream are you working toward?",
  "Who do you want to become?",
];

export default function Journal() {
  usePageView("/journal");
  const { logEvent } = useAnalytics();
  const { user } = useAuth();
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(false);
  const [response, setResponse] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<number | null>(null);
  const [deletedEntry, setDeletedEntry] = useState<{id: number, question: string, response: string} | null>(null);
  const [undoTimeoutId, setUndoTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFilter, setSearchFilter] = useState<"all" | "context" | "title" | "content">("all");
  const [allEntriesCollapsed, setAllEntriesCollapsed] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<"timeline" | "locations" | "experiences" | "challenges" | "growth">("timeline");
  
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
  const scanForMissingData = trpc.notifications.scanForMissingData.useMutation();
  
  // Automatically scan for missing data when entries load
  useEffect(() => {
    if (entries.length > 0) {
      scanForMissingData.mutate();
    }
  }, [entries.length]);
  const createEntry = trpc.journal.create.useMutation({
    onSuccess: () => {
      toast.success("Entry saved successfully!");
      logEvent(EventType.JOURNAL_ENTRY_CREATED, { question: currentQuestion });
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
  
  // Set initial template question on mount
  useEffect(() => {
    if (!currentQuestion) {
      const randomIndex = Math.floor(Math.random() * TEMPLATE_QUESTIONS.length);
      setCurrentQuestion(TEMPLATE_QUESTIONS[randomIndex]);
    }
  }, []);
  
  const handleNextTemplateQuestion = () => {
    const randomIndex = Math.floor(Math.random() * TEMPLATE_QUESTIONS.length);
    setCurrentQuestion(TEMPLATE_QUESTIONS[randomIndex]);
  };
  
  const handlePersonalizedQuestion = async () => {
    setIsLoadingQuestion(true);
    try {
      const result = await utils.journal.generateContextualQuestion.fetch({ category: selectedCategory });
      setCurrentQuestion(result);
      toast.success("Personalized question generated!");
    } catch (e) {
      toast.error("Failed to generate personalized question");
    } finally {
      setIsLoadingQuestion(false);
    }
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
              <p className="text-lg">{currentQuestion || "What would you like to explore today?"}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={handleNextTemplateQuestion} variant="outline" size="sm" className="flex-1 min-w-[140px]">
              <RefreshCw className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Next Question</span>
              <span className="sm:hidden">Next</span>
            </Button>
            <Button onClick={handlePersonalizedQuestion} variant="outline" size="sm" className="flex-1 min-w-[180px]" disabled={isLoadingQuestion}>
              <Sparkles className={`h-4 w-4 mr-2 ${isLoadingQuestion ? 'animate-pulse' : ''}`} />
              <span className="hidden sm:inline">{isLoadingQuestion ? 'Generating...' : 'Ask for Personalized Question'}</span>
              <span className="sm:hidden">{isLoadingQuestion ? 'Loading...' : 'Personalized'}</span>
            </Button>
            <Button onClick={() => {
              const event = new CustomEvent('openMrMgChat', { 
                detail: { 
                  question: currentQuestion,
                  forceNew: true
                } 
              });
              window.dispatchEvent(event);
            }} variant="default" size="sm" className="flex-1 min-w-[140px]">
              <MessageCircle className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Chat with Mr. MG</span>
              <span className="sm:hidden">Chat Mr. MG</span>
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
        <LifeStoryTimeline 
          entries={entries} 
          birthYear={user?.birthYear}
          onViewModeChange={(mode) => setSelectedCategory(mode)}
        />
      )}
      
      {/* Previous Entries - Simple List */}
      {entries.length > 0 && (
        <div>
          {/* All Entries Header with Search */}
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => setAllEntriesCollapsed(!allEntriesCollapsed)}
              className="flex items-center gap-2 text-2xl font-semibold hover:opacity-70 transition-opacity"
            >
              All Entries
              {allEntriesCollapsed ? (
                <ChevronDown className="h-5 w-5" />
              ) : (
                <ChevronUp className="h-5 w-5" />
              )}
            </button>
            
            <div className="flex-1 flex items-center gap-2">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search entries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-background"
                />
              </div>
              
              <Select value={searchFilter} onValueChange={(value: any) => setSearchFilter(value)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Fields</SelectItem>
                  <SelectItem value="context">Context</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="content">Content</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Entries List */}
          {!allEntriesCollapsed && (
            <div className="space-y-4">
              {entries
                .filter((entry) => {
                  if (!searchQuery.trim()) return true;
                  
                  const query = searchQuery.toLowerCase();
                  const contexts = [
                    entry.timeContext,
                    entry.placeContext,
                    entry.experienceType,
                    entry.challengeType,
                    entry.growthTheme
                  ].filter(Boolean).join(" ").toLowerCase();
                  
                  switch (searchFilter) {
                    case "context":
                      return contexts.includes(query);
                    case "title":
                      return entry.question.toLowerCase().includes(query);
                    case "content":
                      return entry.response.toLowerCase().includes(query);
                    case "all":
                    default:
                      return (
                        entry.question.toLowerCase().includes(query) ||
                        entry.response.toLowerCase().includes(query) ||
                        contexts.includes(query)
                      );
                  }
                })
                .map((entry) => (
                  <JournalEntryCard
                    key={entry.id}
                    entry={entry}
                    onDelete={() => handleDeleteClick(entry.id)}
                  />
                ))}
            </div>
          )}
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
            <AlertDialogAction onClick={handleDeleteConfirm}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

