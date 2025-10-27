import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  const [mrMgPromptExpanded, setMrMgPromptExpanded] = useState(false);
  const [voiceProvider, setVoiceProvider] = useState(user?.voiceProvider || "elevenlabs");
  const [providerStatus, setProviderStatus] = useState<{provider: string, available: boolean, message: string} | null>(null);
  const [googleVoice, setGoogleVoice] = useState(user?.googleVoice || "en-US-Neural2-J");
  const [elevenLabsVoice, setElevenLabsVoice] = useState(user?.elevenLabsVoice || "VQypEoV1u8Wo9oGgDmW0");
  
  // Dynamically get ElevenLabs voices from environment variables
  const elevenLabsVoices = Object.entries(import.meta.env)
    .filter(([key]) => key.startsWith('VITE_MEDITATION_VOICE_') || key === 'VITE_MR_MG_VOICE_ID')
    .map(([key, value]) => {
      // Extract voice name from key (e.g., VITE_MEDITATION_VOICE_ANTONI -> Antoni)
      const name = key.replace('VITE_MEDITATION_VOICE_', '').replace('VITE_MR_MG_VOICE_ID', 'MR_MG')
        .split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ');
      return { 
        key: key, // Use env var name as unique key (not voice ID which can be duplicate)
        id: value as string, 
        name 
      };
    })
    .filter(voice => voice.id && voice.id !== '0'); // Filter out placeholder voices
  
  // Get Mr. MG agent (ID 1)
  const { data: mrMgAgent } = trpc.aiChat.getAgent.useQuery({ agentId: 1 });
  const updatePromptMutation = trpc.aiChat.updateAgentSystemPrompt.useMutation();
  const testVoiceMutation = trpc.textToSpeech.generate.useMutation();
  const updateIntroAudioMutation = trpc.user.updateIntroAudio.useMutation();
  const updateVoiceSettingsMutation = trpc.user.updateVoiceSettings.useMutation();
  
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
          <CardHeader className="cursor-pointer" onClick={() => setMrMgPromptExpanded(!mrMgPromptExpanded)}>
            <div className="flex items-center justify-between">
              <CardTitle>Mr. MG Instructions (Admin)</CardTitle>
              <Button variant="ghost" size="sm">
                {mrMgPromptExpanded ? "Collapse" : "Expand"}
              </Button>
            </div>
          </CardHeader>
          {mrMgPromptExpanded && (
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="mrMgPrompt">System Prompt</Label>
                <Textarea
                  id="mrMgPrompt"
                  value={mrMgPrompt}
                  onChange={(e) => setMrMgPrompt(e.target.value)}
                  placeholder="Enter Mr. MG's system instructions..."
                  className="min-h-[200px] max-h-[400px] font-mono text-sm"
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
          )}
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
              updateVoiceSettingsMutation.mutate({ voiceProvider: value });
              
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
                updateVoiceSettingsMutation.mutate({ googleVoice: value }, {
                  onSuccess: () => toast.success("Voice updated!"),
                  onError: () => toast.error("Failed to update voice")
                });
              }}>
                <SelectTrigger id="googleVoice">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en-US-Neural2-J">🇺🇸 Male - Neural2-J (Warm)</SelectItem>
                  <SelectItem value="en-US-Neural2-D">🇺🇸 Male - Neural2-D (Clear)</SelectItem>
                  <SelectItem value="en-US-Neural2-A">🇺🇸 Male - Neural2-A (Deep)</SelectItem>
                  <SelectItem value="en-US-Neural2-I">🇺🇸 Male - Neural2-I (Energetic)</SelectItem>
                  <SelectItem value="en-US-Neural2-C">🇺🇸 Female - Neural2-C (Friendly)</SelectItem>
                  <SelectItem value="en-US-Neural2-F">🇺🇸 Female - Neural2-F (Professional)</SelectItem>
                  <SelectItem value="en-US-Neural2-E">🇺🇸 Female - Neural2-E (Calm)</SelectItem>
                  <SelectItem value="en-US-Neural2-G">🇺🇸 Female - Neural2-G (Confident)</SelectItem>
                  <SelectItem value="en-US-Neural2-H">🇺🇸 Female - Neural2-H (Warm)</SelectItem>
                  <SelectItem value="en-GB-Neural2-B">🇬🇧 Male - Neural2-B (British)</SelectItem>
                  <SelectItem value="en-GB-Neural2-C">🇬🇧 Female - Neural2-C (British)</SelectItem>
                  <SelectItem value="en-GB-Neural2-D">🇬🇧 Male - Neural2-D (British Clear)</SelectItem>
                  <SelectItem value="en-GB-Neural2-F">🇬🇧 Female - Neural2-F (British Warm)</SelectItem>
                  <SelectItem value="en-AU-Neural2-B">🇦🇺 Male - Neural2-B (Australian)</SelectItem>
                  <SelectItem value="en-AU-Neural2-C">🇦🇺 Female - Neural2-C (Australian)</SelectItem>
                  <SelectItem value="en-AU-Neural2-D">🇦🇺 Male - Neural2-D (Australian Clear)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground mt-2">
                Select the voice for Google Cloud TTS. Neural2 voices provide the highest quality.
              </p>
              <Button 
                variant="outline" 
                size="sm"
                className="mt-2"
                disabled={testVoiceMutation.isPending}
                onClick={() => {
                  const testText = "Hello! This is a preview of the selected voice.";
                  
                  toast.info("Generating voice preview...");
                  testVoiceMutation.mutate({
                    text: testText,
                    provider: "google",
                    googleVoice: googleVoice
                  }, {
                    onSuccess: (result) => {
                      if (result.audioUrl) {
                        const audio = new Audio(result.audioUrl);
                        audio.play();
                        toast.success("Playing voice preview!");
                      } else {
                        toast.error("Could not generate preview. Check your Google Cloud TTS API key.");
                      }
                    },
                    onError: (error) => {
                      console.error("Voice preview error:", error);
                      toast.error("Failed to generate voice preview.");
                    }
                  });
                }}
              >
                🔊 {testVoiceMutation.isPending ? "Generating..." : "Test Voice"}
              </Button>
            </div>
          )}
          
          {voiceProvider === "elevenlabs" && (
            <div>
              <Label htmlFor="elevenLabsVoice">ElevenLabs Voice</Label>
              <Select value={elevenLabsVoice} onValueChange={(value) => {
                setElevenLabsVoice(value);
                updateVoiceSettingsMutation.mutate({ elevenLabsVoice: value }, {
                  onSuccess: () => toast.success("Voice updated!"),
                  onError: () => toast.error("Failed to update voice")
                });
              }}>
                <SelectTrigger id="elevenLabsVoice">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {elevenLabsVoices.map(voice => (
                    <SelectItem key={voice.key} value={voice.id}>
                      {voice.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground mt-2">
                Select from your custom ElevenLabs voices.
              </p>
              <Button 
                variant="outline" 
                size="sm"
                className="mt-2"
                disabled={testVoiceMutation.isPending}
                onClick={() => {
                  const testText = "Hello! This is a preview of the selected voice.";
                  const selectedVoice = elevenLabsVoice;
                  
                  toast.info("Generating voice preview...");
                  testVoiceMutation.mutate({
                    text: testText,
                    provider: "elevenlabs",
                    voiceId: selectedVoice
                  }, {
                    onSuccess: (result) => {
                      if (result.audioUrl) {
                        const audio = new Audio(result.audioUrl);
                        audio.play();
                        toast.success("Playing voice preview!");
                      } else {
                        toast.error("Could not generate preview. Check your ElevenLabs API key.");
                      }
                    },
                    onError: (error) => {
                      console.error("Voice preview error:", error);
                      toast.error("Failed to generate voice preview.");
                    }
                  });
                }}
              >
                🔊 {testVoiceMutation.isPending ? "Generating..." : "Test Voice"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      )}
      
      {/* Intro Audio Upload */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Start Here Introduction Audio</CardTitle>
          <CardDescription>
            Upload a custom audio file for Mr. MG's welcome message in the "Start Here" guide
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="introAudio">Audio File (MP3)</Label>
            <Input 
              id="introAudio" 
              type="file" 
              accept="audio/mp3,audio/mpeg"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                
                if (!file.type.includes('mp3') && !file.type.includes('mpeg')) {
                  toast.error('Please upload an MP3 file');
                  return;
                }
                
                // Upload to S3 via storage API
                const formData = new FormData();
                formData.append('file', file);
                
                try {
                  toast.info('Uploading audio file...');
                  const response = await fetch('/api/storage/upload', {
                    method: 'POST',
                    body: formData,
                  });
                  
                  if (!response.ok) {
                    throw new Error('Upload failed');
                  }
                  
                  const result = await response.json();
                  
                  // Save to database instead of localStorage
                  updateIntroAudioMutation.mutate({ audioUrl: result.url }, {
                    onSuccess: () => {
                      toast.success('Audio uploaded successfully!');
                    },
                    onError: (error) => {
                      console.error('Failed to save audio URL:', error);
                      toast.error('Failed to save audio URL');
                    }
                  });
                } catch (error) {
                  console.error('Upload error:', error);
                  toast.error('Failed to upload audio file');
                }
              }}
              className="mt-2"
            />
            <p className="text-sm text-muted-foreground mt-2">
              Current: {user?.introAudioUrl || '/MichaelMrMGIntroV1.mp3 (default)'}
            </p>
          </div>
        </CardContent>
      </Card>
      
      {user?.role === "admin" && false && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>API Key Diagnostics (Admin)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold">ElevenLabs API Key</h3>
              <div className="flex items-center gap-2">
                <code className="text-xs bg-muted px-2 py-1 rounded">ELEVENLABS_API_KEY</code>
                <span className="text-xs text-muted-foreground">Configured in Manus Secrets</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Current error: "invalid_api_key" - The key exists but ElevenLabs is rejecting it.
              </p>
              <p className="text-sm text-yellow-600">
                ⚠️ Please verify your API key at <a href="https://elevenlabs.io/app/settings/api-keys" target="_blank" className="underline">ElevenLabs Dashboard</a>
              </p>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-semibold">Google Cloud TTS API Key</h3>
              <div className="flex items-center gap-2">
                <code className="text-xs bg-muted px-2 py-1 rounded">GOOGLE_CLOUD_TTS_API_KEY</code>
                <span className="text-xs text-muted-foreground">Configured in Manus Secrets</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Use the 🔊 Test Voice button in Voice Settings to verify this key.
              </p>
              <p className="text-sm text-blue-600">
                💡 Get your API key at <a href="https://console.cloud.google.com/apis/credentials" target="_blank" className="underline">Google Cloud Console</a>
              </p>
            </div>
            
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">How to Fix API Key Issues:</h4>
              <ol className="text-sm space-y-1 list-decimal list-inside">
                <li>Go to Manus UI → Settings → Secrets</li>
                <li>Update ELEVENLABS_API_KEY or GOOGLE_CLOUD_TTS_API_KEY</li>
                <li>Restart the dev server (click Restart in Manus UI)</li>
                <li>Test again using the 🔊 Test Voice button</li>
              </ol>
            </div>
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
