import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Send, Loader2, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";

export default function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [currentSession, setCurrentSession] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [showAgentSelector, setShowAgentSelector] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

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
                <ScrollArea className="flex-1 p-4" ref={scrollRef}>
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
                </ScrollArea>

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
                    <Button
                      onClick={handleSendMessage}
                      disabled={!message.trim() || sendMessage.isPending}
                      size="icon"
                      className="flex-shrink-0"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
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
