import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Settings() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [mrMgPrompt, setMrMgPrompt] = useState("");
  const [voiceProvider, setVoiceProvider] = useState(localStorage.getItem("voiceProvider") || "elevenlabs");
  const [providerStatus, setProviderStatus] = useState<{provider: string, available: boolean, message: string} | null>(null);
  const [googleVoice, setGoogleVoice] = useState(localStorage.getItem("googleVoice") || "en-US-Neural2-J");
  
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
      
      {user?.role === "admin" && (
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
      )}
      
      {user?.role === "admin" && (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Voice Settings (Admin)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="voiceProvider">Voice Provider</Label>
            <Select value={voiceProvider} onValueChange={async (value) => {
              setVoiceProvider(value);
              localStorage.setItem("voiceProvider", value);
              
              // Test the provider by making a test call
              try {
                const testResult = await fetch('/api/trpc/textToSpeech.generate', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    text: "Test",
                    provider: value,
                  }),
                });
                
                if (value === "browser") {
                  setProviderStatus({
                    provider: value,
                    available: true,
                    message: "Browser TTS is always available (free, no API key needed)"
                  });
                  toast.success("Voice provider updated to Browser TTS!");
                } else {
                  const data = await testResult.json();
                  if (data.result?.data?.audioUrl || testResult.ok) {
                    setProviderStatus({
                      provider: value,
                      available: true,
                      message: `${value === 'elevenlabs' ? 'ElevenLabs' : 'Google Cloud TTS'} is configured and working`
                    });
                    toast.success("Voice provider updated!");
                  } else {
                    setProviderStatus({
                      provider: value,
                      available: false,
                      message: `API key missing or invalid. Falling back to Browser TTS. Add ${value === 'elevenlabs' ? 'ELEVENLABS_API_KEY' : 'GOOGLE_CLOUD_TTS_API_KEY'} in Manus Settings → Secrets.`
                    });
                    toast.warning(`${value === 'elevenlabs' ? 'ElevenLabs' : 'Google Cloud TTS'} API key not configured. Using Browser TTS instead.`);
                  }
                }
              } catch (error) {
                setProviderStatus({
                  provider: value,
                  available: false,
                  message: `Failed to verify provider. Falling back to Browser TTS.`
                });
                toast.warning("Could not verify provider. Using Browser TTS.");
              }
            }}>
              <SelectTrigger id="voiceProvider">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="elevenlabs">ElevenLabs (High Quality, Expensive)</SelectItem>
                <SelectItem value="google">Google Cloud TTS (Good Quality, Affordable)</SelectItem>
                <SelectItem value="browser">Browser TTS (Free, Basic Quality)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground mt-2">
              Choose the text-to-speech provider for Mr. MG's voice and meditation audio. Changes take effect immediately.
            </p>
            {providerStatus && (
              <div className={`mt-3 p-3 rounded-md border ${
                providerStatus.available 
                  ? 'bg-green-50 border-green-200 text-green-800' 
                  : 'bg-yellow-50 border-yellow-200 text-yellow-800'
              }`}>
                <p className="text-sm font-medium">
                  {providerStatus.available ? '✓ ' : '⚠ '}
                  {providerStatus.message}
                </p>
              </div>
            )}
          </div>
          
          {voiceProvider === "google" && (
            <div>
              <Label htmlFor="googleVoice">Google Cloud TTS Voice</Label>
              <Select value={googleVoice} onValueChange={(value) => {
                setGoogleVoice(value);
                localStorage.setItem("googleVoice", value);
                toast.success("Voice updated!");
              }}>
                <SelectTrigger id="googleVoice">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en-US-Neural2-J">English (US) - Male (Neural2-J)</SelectItem>
                  <SelectItem value="en-US-Neural2-C">English (US) - Female (Neural2-C)</SelectItem>
                  <SelectItem value="en-US-Neural2-D">English (US) - Male (Neural2-D)</SelectItem>
                  <SelectItem value="en-US-Neural2-F">English (US) - Female (Neural2-F)</SelectItem>
                  <SelectItem value="en-GB-Neural2-B">English (UK) - Male (Neural2-B)</SelectItem>
                  <SelectItem value="en-GB-Neural2-C">English (UK) - Female (Neural2-C)</SelectItem>
                  <SelectItem value="en-AU-Neural2-B">English (AU) - Male (Neural2-B)</SelectItem>
                  <SelectItem value="en-AU-Neural2-C">English (AU) - Female (Neural2-C)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground mt-2">
                Select the voice for Google Cloud TTS. Neural2 voices provide the highest quality.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      )}
      
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
