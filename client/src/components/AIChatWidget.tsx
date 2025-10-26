import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, X, Mic, Volume2, VolumeX, RotateCcw, MessageSquare } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { MR_MG_AVATAR, MR_MG_NAME, MR_MG_TITLE } from "@/const";
import { useVoiceChat } from "@/hooks/useVoiceChat";


interface AIChatWidgetProps {
  sidebarOpen?: boolean;
}

export default function AIChatWidget({ sidebarOpen = false }: AIChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentSession, setCurrentSession] = useState<number | null>(() => {
    // Load session from localStorage on mount
    const saved = localStorage.getItem('mrMgSessionId');
    return saved ? parseInt(saved, 10) : null;
  });
  const [message, setMessage] = useState("");
  const [hasGreeted, setHasGreeted] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [showConversations, setShowConversations] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastSpokenMessageRef = useRef<string | null>(null);
  const { isListening, isSpeaking, transcript, error: voiceError, startListening, stopListening, speak, stopSpeaking } = useVoiceChat();
  
  // Helper function to strip markdown formatting for TTS
  const stripMarkdown = (text: string): string => {
    return text
      .replace(/\*\*(.+?)\*\*/g, '$1')  // Remove bold **text**
      .replace(/\*(.+?)\*/g, '$1')      // Remove italic *text*
      .replace(/\[(.+?)\]\(.+?\)/g, '$1') // Remove links [text](url)
      .replace(/`(.+?)`/g, '$1')        // Remove inline code `text`
      .replace(/^#+\s+/gm, '')          // Remove headers
      .replace(/^[-*]\s+/gm, '')        // Remove list markers
      .trim();
  };

  const { data: userStats } = trpc.journal.getStats.useQuery();
  const { data: latestEntry } = trpc.journal.getLatestEntry.useQuery();
  const { data: insightfulQuestion } = trpc.journal.generateInsightfulQuestion.useQuery(
    { entryId: latestEntry?.id || 0 },
    { enabled: !!latestEntry?.id }
  );
  const { data: messages = [], refetch: refetchMessages } = trpc.aiChat.getMessages.useQuery(
    { sessionId: currentSession! },
    { enabled: !!currentSession }
  );
  
  // Get list of all user's chat sessions
  const { data: sessions = [], refetch: refetchSessions } = trpc.aiChat.listSessions.useQuery(
    { agentId: 1 }, // Mr. MG agent ID
    { enabled: showConversations }
  );

  const createSession = trpc.aiChat.createSession.useMutation({
    onSuccess: (data) => {
      setCurrentSession(data.sessionId);
      // Save session ID to sessionStorage (resets on browser close/logout)
      sessionStorage.setItem('mrMgSessionId', String(data.sessionId));
    },
  });

  // Use sendMessage for regular chat (uses database system prompt)
  const sendMessageMutation = trpc.aiChat.sendMessage.useMutation({
    onSuccess: () => {
      refetchMessages();
      setMessage("");
    },
    onError: (error) => {
      toast.error("Failed to send message: " + error.message);
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

  // Speak Mr. MG's responses when voice is enabled
  useEffect(() => {
    if (voiceEnabled && messages.length > 0 && !isSpeaking) {
      const lastMessage = messages[messages.length - 1];
      // Only speak if it's an assistant message and we haven't spoken it yet
      if (lastMessage.role === 'assistant' && lastMessage.content !== lastSpokenMessageRef.current) {
        lastSpokenMessageRef.current = lastMessage.content;
        // Use Mr. MG custom voice ID
        const voiceId = '0QOtNhDO4bFWGkFLco6Y';
        // Strip markdown before speaking
        const cleanText = stripMarkdown(lastMessage.content);
        speak(cleanText, voiceId);
      }
    }
  }, [messages, voiceEnabled, isSpeaking, speak]);

  // Update message with live transcript while listening
  useEffect(() => {
    if (isListening && transcript) {
      setMessage(transcript);
    }
  }, [transcript, isListening]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Initialize session without auto-opening
  useEffect(() => {
    if (!currentSession && !hasGreeted) {
      initializeMrMgSession();
    }
  }, [currentSession, hasGreeted]);
  
  // Listen for external open requests
  useEffect(() => {
    const handleOpenChat = () => {
      setIsOpen(true);
      if (!currentSession) initializeMrMgSession();
    };
    
    window.addEventListener('openMrMgChat', handleOpenChat);
    return () => window.removeEventListener('openMrMgChat', handleOpenChat);
  }, [currentSession]);
  
  // Prevent body scroll on mobile when chat is open
  useEffect(() => {
    if (isOpen && window.innerWidth < 640) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }
    
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [isOpen]);

  const initializeMrMgSession = async () => {
    if (!currentSession && !hasGreeted) {
      // Check if we have an existing session in sessionStorage (resets on logout)
      const savedSessionId = sessionStorage.getItem('mrMgSessionId');
      if (savedSessionId) {
        setCurrentSession(parseInt(savedSessionId, 10));
        setHasGreeted(true);
      } else {
        // Create new session if none exists
        const mrMgAgent = { id: 1, name: MR_MG_NAME, avatar: MR_MG_AVATAR, role: "Life Mentor" };
        createSession.mutate({ agentId: mrMgAgent.id });
        setHasGreeted(true);
      }
    }
  };

  const handleSendMessage = () => {
    if (!message.trim() || !currentSession) return;
    
    // Use sendMessage to respect database system prompt
    sendMessageMutation.mutate({
      sessionId: currentSession,
      message: message.trim(),
    });
  };

  const handleClearChat = async () => {
    if (!confirm("Start a new conversation? This will clear the current chat history.")) {
      return;
    }
    
    // Clear session storage
    sessionStorage.removeItem('mrMgSessionId');
    setCurrentSession(null);
    setHasGreeted(false);
    
    // Create new session
    await initializeMrMgSession();
    
    toast.success("New conversation started!");
  };

  const handleVoiceInput = () => {
    if (isListening) {
      // Stop listening and keep the transcript
      stopListening();
    } else {
      // Check if there's existing text to append to
      const hasExistingText = message.trim().length > 0;
      if (hasExistingText) {
        // Append mode - keep existing text and add to it
        startListening(true);
      } else {
        // Fresh start - clear and begin
        setMessage('');
        startListening(false);
      }
    }
  };

  const toggleVoice = () => {
    if (voiceEnabled) {
      stopSpeaking();
    }
    setVoiceEnabled(!voiceEnabled);
  };

  const getContextualGreeting = () => {
    if (!userStats) return "Welcome! I'm here to guide you on your journey to discovering your Primary Aim.";
    
    const { journalEntries = 0, meditations = 0, visionItems = 0, patterns = 0 } = userStats;
    
    // If we have a latest entry and an insightful question, use that
    if (latestEntry && insightfulQuestion) {
      return insightfulQuestion;
    }
    
    if (journalEntries === 0) {
      return "Welcome! I'm Mr. MG, your life mentor. I see you haven't started your Life Story yet. Shall we begin by exploring a formative moment from your past?";
    }
    
    if (journalEntries > 0 && journalEntries < 3) {
      return `Good to see you! You've shared ${journalEntries} ${journalEntries === 1 ? 'story' : 'stories'} so far. Would you like to continue exploring your life experiences, or shall we look at the patterns emerging?`;
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
    
    return `Welcome back! You're making wonderful progress. What would you like to explore today?`;
  };

  return (
    <>
      {/* Floating Mr. MG Button */}
      {!isOpen && !sidebarOpen && (
        <Button
          onClick={() => {
            setIsOpen(true);
            if (!currentSession) initializeMrMgSession();
          }}
          className="fixed bottom-4 left-4 h-14 w-14 sm:h-16 sm:w-16 sm:bottom-6 sm:left-6 rounded-full shadow-lg bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 z-50 text-2xl sm:text-3xl"
          size="icon"
        >
          {MR_MG_AVATAR}
        </Button>
      )}

      {/* Mr. MG Chat Window */}
      {isOpen && (
        <>
        {/* Mobile overlay to prevent background scroll */}
        <div className="fixed inset-0 bg-black/20 z-40 sm:hidden" onClick={() => setIsOpen(false)} />
        <Card className="fixed inset-0 sm:inset-auto sm:bottom-6 sm:left-6 sm:w-96 sm:h-[600px] shadow-2xl z-50 flex flex-col border-2 border-purple-200 max-h-screen">
          <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-pink-50 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-4xl">{MR_MG_AVATAR}</span>
                <div>
                  <CardTitle className="text-lg">{MR_MG_NAME}</CardTitle>
                  <p className="text-xs text-muted-foreground">{MR_MG_TITLE}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setShowConversations(!showConversations)}
                  title="View conversations"
                >
                  <MessageSquare className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleClearChat}
                  title="Start new conversation"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          
          {/* Conversations List */}
          {showConversations && (
            <div className="border-b bg-gray-50 p-4 max-h-64 overflow-y-auto">
              <h3 className="font-semibold text-sm mb-2">Your Conversations</h3>
              <div className="space-y-2">
                {sessions.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No previous conversations</p>
                ) : (
                  sessions.map((session: any) => (
                    <button
                      key={session.id}
                      onClick={() => {
                        setCurrentSession(session.id);
                        sessionStorage.setItem('mrMgSessionId', String(session.id));
                        setShowConversations(false);
                        refetchMessages();
                      }}
                      className={`w-full text-left p-2 rounded hover:bg-gray-100 text-xs ${
                        session.id === currentSession ? 'bg-purple-100 border border-purple-300' : 'bg-white border'
                      }`}
                    >
                      <div className="font-medium truncate">
                        {session.title || 'Conversation'}
                      </div>
                      <div className="text-muted-foreground text-[10px]">
                        {new Date(session.createdAt).toLocaleDateString()}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          <CardContent className="flex-1 p-0 flex flex-col min-h-0">
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4" ref={scrollRef}>
              <div className="space-y-4">
                {/* Initial greeting */}
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
                {sendMessageMutation.isPending && (
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
              <div className="flex gap-2 mb-2">
                <Button
                  onClick={handleVoiceInput}
                  variant={isListening ? "default" : "outline"}
                  size="icon"
                  className={`min-h-[44px] min-w-[44px] ${isListening ? "bg-red-500 hover:bg-red-600 animate-pulse" : ""}`}
                  title={isListening ? "Stop recording" : "Start voice input"}
                >
                  <Mic className="h-4 w-4" />
                </Button>
                <Button
                  onClick={toggleVoice}
                  variant="outline"
                  size="icon"
                  className="min-h-[44px] min-w-[44px]"
                  title={voiceEnabled ? "Disable voice responses" : "Enable voice responses"}
                >
                  {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </Button>
              </div>
              <div className="flex gap-2">
                <Textarea
                  ref={textareaRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onFocus={(e) => {
                    // On mobile, scroll textarea into view when keyboard appears
                    if (window.innerWidth < 640) {
                      setTimeout(() => {
                        e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }, 300); // Delay to let keyboard animation finish
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Share your thoughts with Mr. MG..."
                  className="min-h-[60px] sm:min-h-[80px] resize-none text-base"
                  disabled={sendMessageMutation.isPending || isListening}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!message.trim() || sendMessageMutation.isPending}
                  size="icon"
                  className="flex-shrink-0 min-h-[44px] min-w-[44px] bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {isListening ? "Listening... speak now" : "Press Enter to send, Shift+Enter for new line"}
              </p>
              {voiceError && (
                <p className="text-xs text-red-500 mt-1">{voiceError}</p>
              )}
            </div>
          </CardContent>
        </Card>
        </>
      )}
    </>
  );
}

