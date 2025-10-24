import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Send, Loader2, X, BookOpen, Mic, MicOff, Volume2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";

export default function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [currentSession, setCurrentSession] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [showAgentSelector, setShowAgentSelector] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);


  const { data: agents = [] } = trpc.aiChat.listAgents.useQuery();
  const { data: messages = [], refetch: refetchMessages } = trpc.aiChat.getMessages.useQuery(
    { sessionId: currentSession! },
    { enabled: !!currentSession }
  );

  const createSession = trpc.aiChat.createSession.useMutation({
    onSuccess: (data) => {
      setCurrentSession(data.sessionId);
      setShowAgentSelector(false);
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

  const handleSelectAgent = (agent: any) => {
    setSelectedAgent(agent);
    createSession.mutate({ agentId: agent.id });
  };

  const handleSendMessage = () => {
    if (!message.trim() || !currentSession) return;
    sendMessage.mutate({
      sessionId: currentSession,
      message: message.trim(),
    });
  };

  const handleNewChat = () => {
    setCurrentSession(null);
    setSelectedAgent(null);
    setShowAgentSelector(true);
  };


  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await transcribeAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.success("Recording...");
    } catch (error) {
      toast.error("Microphone access denied");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      // Use Web Speech API for transcription (browser-native)
      const recognition = new ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setMessage(transcript);
        toast.success("Transcribed!");
      };
      
      recognition.onerror = () => {
        toast.error("Transcription failed");
      };
      
      recognition.start();
    } catch (error) {
      toast.error("Speech recognition not supported");
    }
  };

  const speakMessage = (text: string) => {
    if (!window.speechSynthesis) {
      toast.error("Text-to-speech not supported");
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <Button
          onClick={() => {
            setIsOpen(true);
            if (!currentSession) setShowAgentSelector(true);
          }}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg animate-pulse-glow z-50"
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-96 h-[600px] shadow-2xl z-50 flex flex-col">
          <CardHeader className="border-b flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {selectedAgent && <span className="text-2xl">{selectedAgent.avatar}</span>}
                <div>
                  <CardTitle className="text-lg">
                    {selectedAgent ? selectedAgent.name : "AI Assistants"}
                  </CardTitle>
                  {selectedAgent && (
                    <p className="text-xs text-muted-foreground">{selectedAgent.role}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-1">
                {selectedAgent && (
                  <Button variant="ghost" size="sm" onClick={handleNewChat}>
                    New Chat
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex-1 p-0 flex flex-col min-h-0">
            {/* Agent Selector */}
            {showAgentSelector && (
              <div className="p-4 space-y-3 overflow-y-auto">
                <p className="text-sm text-muted-foreground mb-4">
                  Choose an AI assistant to help you:
                </p>
                {agents.map((agent) => (
                  <Card
                    key={agent.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleSelectAgent(agent)}
                  >
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        <span className="text-3xl">{agent.avatar}</span>
                        <div className="flex-1">
                          <h3 className="font-semibold">{agent.name}</h3>
                          <p className="text-xs text-muted-foreground">{agent.role}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Chat Messages */}
            {currentSession && !showAgentSelector && (
              <>
                <div className="flex-1 overflow-y-auto p-4" ref={scrollRef}>
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-3 ${
                            msg.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary"
                          }`}
                        >
                          {msg.role === "assistant" && (
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-lg">{selectedAgent?.avatar}</span>
                              <span className="text-xs font-medium">{selectedAgent?.name}</span>
                            </div>
                          )}
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      </div>
                    ))}
                    {sendMessage.isPending && (
                      <div className="flex justify-start">
                        <div className="bg-secondary rounded-lg p-3">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Message Input */}
                <div className="p-4 border-t flex-shrink-0">
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
                      placeholder="Type your message..."
                      className="min-h-[60px] resize-none"
                      disabled={sendMessage.isPending}
                    />
                    <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={isRecording ? stopRecording : startRecording}
                  className={isRecording ? "bg-red-500 text-white" : ""}
                >
                  {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
                <Button
                      onClick={handleSendMessage}
                      disabled={!message.trim() || sendMessage.isPending}
                      size="icon"
                      className="flex-shrink-0"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
              </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Press Enter to send, Shift+Enter for new line
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
}
