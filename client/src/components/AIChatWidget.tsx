import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { MR_MG_AVATAR, MR_MG_NAME } from "@/const";

export default function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentSession, setCurrentSession] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [hasGreeted, setHasGreeted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: userStats } = trpc.journal.getStats.useQuery();
  const { data: messages = [], refetch: refetchMessages } = trpc.aiChat.getMessages.useQuery(
    { sessionId: currentSession! },
    { enabled: !!currentSession }
  );

  const createSession = trpc.aiChat.createSession.useMutation({
    onSuccess: (data) => {
      setCurrentSession(data.sessionId);
    },
  });

  const sendMessage = trpc.aiChat.sendMessage.useMutation({
    onSuccess: () => {
      refetchMessages();
      setMessage("");
    },
    onError: (error) => {
      toast.error("Failed to send message: " + error.message);
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Auto-open and greet returning users
  useEffect(() => {
    if (userStats && !hasGreeted && !isOpen) {
      const hasContent = (userStats.journalEntries || 0) > 0 || 
                        (userStats.meditations || 0) > 0 || 
                        (userStats.visionItems || 0) > 0;
      
      if (hasContent) {
        // Delay opening to avoid interrupting page load
        setTimeout(() => {
          setIsOpen(true);
          initializeMrMgSession();
        }, 2000);
      }
    }
  }, [userStats, hasGreeted, isOpen]);

  const initializeMrMgSession = async () => {
    if (!currentSession && !hasGreeted) {
      // Find or create Mr. MG agent session
      const mrMgAgent = { id: 1, name: MR_MG_NAME, avatar: MR_MG_AVATAR, role: "Life Mentor" };
      createSession.mutate({ agentId: mrMgAgent.id });
      setHasGreeted(true);
    }
  };

  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    if (!currentSession) {
      // Create session if it doesn't exist
      initializeMrMgSession();
      // Wait for session creation before sending
      setTimeout(() => {
        if (currentSession) {
          sendMessage.mutate({
            sessionId: currentSession,
            message: message.trim(),
          });
        }
      }, 500);
    } else {
      sendMessage.mutate({
        sessionId: currentSession,
        message: message.trim(),
      });
    }
  };

  const getContextualGreeting = () => {
    if (!userStats) return "Welcome! I'm here to guide you on your journey to discovering your Primary Aim.";
    
    const { journalEntries = 0, meditations = 0, visionItems = 0, patterns = 0 } = userStats;
    
    if (journalEntries === 0) {
      return "Welcome back! I'm Mr. MG, your life mentor. I see you haven't started your Life Story yet. Shall we begin by exploring a formative moment from your past?";
    }
    
    if (journalEntries > 0 && journalEntries < 3) {
      return `Good to see you again! You've shared ${journalEntries} ${journalEntries === 1 ? 'story' : 'stories'} so far. Would you like to continue exploring your life experiences, or shall we look at the patterns emerging?`;
    }
    
    if (journalEntries >= 3 && patterns === 0) {
      return `Welcome back! You've documented ${journalEntries} meaningful moments. I'm noticing some patterns in your journey. Would you like me to help you discover what they reveal about your values and purpose?`;
    }
    
    if (patterns > 0 && visionItems === 0) {
      return `Hello again! You've uncovered ${patterns} ${patterns === 1 ? 'pattern' : 'patterns'} in your story. These insights are powerful! Ready to translate them into a vision for your future?`;
    }
    
    if (visionItems > 0 && meditations === 0) {
      return `Great progress! Your vision board has ${visionItems} ${visionItems === 1 ? 'item' : 'items'}. Would you like to create a personalized meditation to help you embody these aspirations?`;
    }
    
    return `Welcome back! You're making wonderful progress: ${journalEntries} life stories, ${patterns} patterns discovered, ${visionItems} vision items, and ${meditations} meditations. What would you like to explore today?`;
  };

  return (
    <>
      {/* Floating Mr. MG Button */}
      {!isOpen && (
        <Button
          onClick={() => {
            setIsOpen(true);
            if (!currentSession) initializeMrMgSession();
          }}
          className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-lg bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 z-50 text-3xl"
          size="icon"
        >
          {MR_MG_AVATAR}
        </Button>
      )}

      {/* Mr. MG Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-96 h-[600px] shadow-2xl z-50 flex flex-col border-2 border-purple-200">
          <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-pink-50 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-4xl">{MR_MG_AVATAR}</span>
                <div>
                  <CardTitle className="text-lg">{MR_MG_NAME}</CardTitle>
                  <p className="text-xs text-muted-foreground">Your Life Mentor</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="flex-1 p-0 flex flex-col min-h-0">
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4" ref={scrollRef}>
              <div className="space-y-4">
                {/* Initial greeting */}
                {messages.length === 0 && (
                  <div className="flex justify-start">
                    <div className="max-w-[85%] rounded-lg p-4 bg-gradient-to-br from-purple-100 to-pink-100">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{MR_MG_AVATAR}</span>
                        <span className="text-xs font-medium">{MR_MG_NAME}</span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{getContextualGreeting()}</p>
                    </div>
                  </div>
                )}
                
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg p-3 ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-gradient-to-br from-purple-100 to-pink-100"
                      }`}
                    >
                      {msg.role === "assistant" && (
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{MR_MG_AVATAR}</span>
                          <span className="text-xs font-medium">{MR_MG_NAME}</span>
                        </div>
                      )}
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}
                {sendMessage.isPending && (
                  <div className="flex justify-start">
                    <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg p-3">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Message Input */}
            <div className="p-4 border-t flex-shrink-0 bg-gradient-to-r from-purple-50/30 to-pink-50/30">
              <div className="flex gap-2">
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Share your thoughts with Mr. MG..."
                  className="min-h-[60px] resize-none"
                  disabled={sendMessage.isPending}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!message.trim() || sendMessage.isPending}
                  size="icon"
                  className="flex-shrink-0 bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Press Enter to send, Shift+Enter for new line
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}

