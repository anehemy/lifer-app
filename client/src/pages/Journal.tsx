import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  const [showMrMgChat, setShowMrMgChat] = useState(false);
  const [mrMgMessage, setMrMgMessage] = useState("");
  const [mrMgResponse, setMrMgResponse] = useState("");
  
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
      toast.success("Entry deleted");
      utils.journal.list.invalidate();
      utils.patterns.analyze.invalidate();
    },
  });
  
  const askMrMg = trpc.journal.askMrMg.useMutation({
    onSuccess: (data) => {
      setMrMgResponse(data.response);
    },
    onError: () => {
      toast.error("Failed to get response from Mr. MG");
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
            <img src={MR_MG_AVATAR} alt={MR_MG_NAME} className="w-16 h-16 rounded-full object-cover" />
            <div className="flex-1">
              <CardTitle className="mb-2">{MR_MG_NAME} asks:</CardTitle>
              <p className="text-lg">{currentQuestion}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button onClick={handleNextQuestion} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Ask Another Question
            </Button>
            <Button onClick={() => setShowMrMgChat(true)} variant="default" size="sm">
              <MessageCircle className="h-4 w-4 mr-2" />
              Ask Mr. MG for Guidance
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
        </div>
      )}
      
      {/* Mr. MG Chat Dialog */}
      <Dialog open={showMrMgChat} onOpenChange={setShowMrMgChat}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <img src={MR_MG_AVATAR} alt={MR_MG_NAME} className="w-12 h-12 rounded-full object-cover" />
              <div>
                <DialogTitle>Ask {MR_MG_NAME}</DialogTitle>
                <p className="text-sm text-muted-foreground">Get personalized guidance on your current question</p>
              </div>
            </div>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
              <p className="text-sm font-medium text-purple-900 dark:text-purple-100 mb-2">Current Question:</p>
              <p className="text-sm">{currentQuestion}</p>
            </div>
            
            {mrMgResponse && (
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 rounded-lg">
                <div className="flex items-start gap-3 mb-3">
                  <img src={MR_MG_AVATAR} alt={MR_MG_NAME} className="w-8 h-8 rounded-full object-cover" />
                  <p className="font-medium">{MR_MG_NAME} says:</p>
                </div>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{mrMgResponse}</p>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="mrMgMessage">Your Message</Label>
              <Textarea
                id="mrMgMessage"
                value={mrMgMessage}
                onChange={(e) => setMrMgMessage(e.target.value)}
                placeholder="Ask Mr. MG for guidance on this question..."
                className="min-h-[100px]"
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowMrMgChat(false);
                  setMrMgMessage("");
                  setMrMgResponse("");
                }}
              >
                Close
              </Button>
              <Button 
                onClick={() => {
                  if (!mrMgMessage.trim()) {
                    toast.error("Please enter a message");
                    return;
                  }
                  askMrMg.mutate({ 
                    question: currentQuestion, 
                    userMessage: mrMgMessage 
                  });
                }}
                disabled={askMrMg.isPending}
              >
                {askMrMg.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Thinking...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Ask Mr. MG
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
