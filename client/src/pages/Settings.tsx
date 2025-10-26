import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Textarea } from "@/components/ui/textarea";

export default function Settings() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [mrMgPrompt, setMrMgPrompt] = useState("");
  
  // Get Mr. MG agent (ID 1)
  const { data: mrMgAgent } = trpc.aiChat.getAgent.useQuery({ agentId: 1 });
  const updatePromptMutation = trpc.aiChat.updateAgentSystemPrompt.useMutation();
  
  useEffect(() => {
    if (mrMgAgent?.systemPrompt) {
      setMrMgPrompt(mrMgAgent.systemPrompt);
    }
  }, [mrMgAgent]);
  
  const handleSavePrompt = async () => {
    try {
      await updatePromptMutation.mutateAsync({
        agentId: 1,
        systemPrompt: mrMgPrompt,
      });
      toast.success("Mr. MG instructions updated successfully!");
    } catch (error) {
      toast.error("Failed to update instructions");
    }
  };

  
  return (
    <div className="container max-w-4xl py-8">
      <h1 className="text-4xl font-bold mb-8">Settings</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              type="email"
              disabled
            />
            <p className="text-sm text-muted-foreground mt-1">
              Email cannot be changed. Managed through OAuth provider.
            </p>
          </div>
          <div>
            <Label>Role</Label>
            <Input value={user?.role || "user"} disabled />
          </div>
        </CardContent>
      </Card>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Mr. MG Instructions (Admin)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="mrMgPrompt">System Prompt</Label>
            <Textarea
              id="mrMgPrompt"
              value={mrMgPrompt}
              onChange={(e) => setMrMgPrompt(e.target.value)}
              placeholder="Enter Mr. MG's system instructions..."
              className="min-h-[300px] font-mono text-sm"
            />
            <p className="text-sm text-muted-foreground mt-2">
              Customize how Mr. MG responds and behaves. Changes take effect immediately for new conversations.
            </p>
          </div>
          <Button 
            onClick={handleSavePrompt}
            disabled={updatePromptMutation.isPending}
          >
            {updatePromptMutation.isPending ? "Saving..." : "Save Instructions"}
          </Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Data & Privacy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Export Your Data</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Download all your journal entries, vision board, and meditation sessions.
            </p>
            <Button variant="outline">Export Data</Button>
          </div>
          <div>
            <h3 className="font-semibold mb-2 text-destructive">Delete Account</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <Button variant="destructive">Delete Account</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
