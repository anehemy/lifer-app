import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { Play, Clock, Star, Pause, X, Volume2, VolumeX } from "lucide-react";
import MeditationCustomizer from "@/components/MeditationCustomizer";

const meditationTypes = [
  "Stress Release",
  "Manifestation",
  "Self-Love",
  "Gratitude",
  "Purpose & Clarity",
  "Healing",
  "Energy & Vitality",
  "Sleep Preparation",
];

const durations = [1, 5, 10, 15, 20, 30];

export default function Meditation() {
  const [selectedType, setSelectedType] = useState(meditationTypes[0]);
  const [selectedDuration, setSelectedDuration] = useState(10);
  const [showPlayer, setShowPlayer] = useState(false);
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [showReflection, setShowReflection] = useState(false);
  const [reflection, setReflection] = useState("");
  const [rating, setRating] = useState(0);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [userContext, setUserContext] = useState<any>(null);
  
  const { data: contextData } = trpc.meditation.getUserContext.useQuery();
  
  const utils = trpc.useUtils();
  const { data: sessions = [] } = trpc.meditation.list.useQuery();
  
  const generateMeditation = trpc.meditation.generate.useMutation({
    onSuccess: (session) => {
      setCurrentSession(session);
      setShowPlayer(true);
      toast.success("Meditation ready!");
    },
    onError: () => {
      toast.error("Failed to generate meditation");
    },
  });
  
  const saveReflection = trpc.meditation.saveReflection.useMutation({
    onSuccess: () => {
      toast.success("Reflection saved!");
      utils.meditation.list.invalidate();
      setShowReflection(false);
      setCurrentSession(null);
      setReflection("");
      setRating(0);
    },
  });
  
  const handleGenerate = () => {
    // Always show customizer to let user select what to include
    setUserContext(contextData || {
      firstName: "friend",
      recentJournalEntries: [],
      visionItems: [],
      primaryAimStatement: null,
      patterns: [],
    });
    setShowCustomizer(true);
  };
  
  const handleCustomizerConfirm = (selectedContext: any) => {
    setShowCustomizer(false);
    generateMeditation.mutate({
      meditationType: selectedType,
      durationMinutes: selectedDuration,
      customContext: selectedContext,
      ambientSound: selectedContext.ambientSound || "none",
    });
  };
  
  const handleMeditationComplete = () => {
    setShowPlayer(false);
    setShowReflection(true);
  };
  
  const handleSaveReflection = () => {
    if (!currentSession) return;
    saveReflection.mutate({
      sessionId: currentSession.id,
      reflection,
      rating: rating || undefined,
    });
  };
  
  const handlePlayerClose = () => {
    setShowPlayer(false);
    setCurrentSession(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2">Guided Meditation</h1>
        <p className="text-muted-foreground">Find your center with personalized meditations</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create New Meditation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Meditation Type</Label>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {meditationTypes.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Duration</Label>
            <Select value={selectedDuration.toString()} onValueChange={(v) => setSelectedDuration(Number(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {durations.map((dur) => (
                  <SelectItem key={dur} value={dur.toString()}>{dur} minutes</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button 
            onClick={handleGenerate} 
            disabled={generateMeditation.isPending}
            className="w-full"
          >
            {generateMeditation.isPending ? "Generating..." : "Generate Personalized Meditation"}
          </Button>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-2xl font-semibold mb-4">Past Meditations</h2>
        <div className="grid gap-4">
          {sessions.map((session) => (
            <Card key={session.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold">{session.meditationType}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {session.durationMinutes} min
                      </span>
                      <span>{new Date(session.completedAt).toLocaleDateString()}</span>
                      {session.rating && (
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          {session.rating}/5
                        </span>
                      )}
                    </div>
                    {session.reflection && (
                      <p className="text-sm mt-2 text-muted-foreground italic">"{session.reflection}"</p>
                    )}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setCurrentSession(session);
                      setShowPlayer(true);
                    }}
                  >
                    <Play className="h-4 w-4 mr-1" />
                    Replay
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {showPlayer && currentSession && (
        <MeditationPlayer 
          session={currentSession}
          onComplete={handleMeditationComplete}
          onClose={handlePlayerClose}
        />
      )}

      <Dialog open={showReflection} onOpenChange={setShowReflection}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>How was your meditation?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Rate your experience</Label>
              <div className="flex gap-2 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="focus:outline-none"
                  >
                    <Star 
                      className={`h-8 w-8 ${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Reflection (optional)</Label>
              <Textarea 
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                placeholder="How do you feel? Any insights or thoughts?"
                rows={4}
              />
            </div>
            <Button onClick={handleSaveReflection} className="w-full">
              Save & Complete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {showCustomizer && userContext && (
        <MeditationCustomizer
          open={showCustomizer}
          onClose={() => setShowCustomizer(false)}
          onConfirm={handleCustomizerConfirm}
          userContext={userContext}
          meditationType={selectedType}
        />
      )}
    </div>
  );
}

function MeditationPlayer({ session, onComplete, onClose }: any) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Cleanup on unmount or close
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      window.speechSynthesis.cancel();
    };
  }, []);
  
  const handlePlay = () => {
    if (session.audioUrl) {
      // Play actual audio file
      if (!audioRef.current) {
        const audio = new Audio(session.audioUrl);
        audio.onended = () => {
          setIsPlaying(false);
          setProgress(100);
          onComplete();
        };
        audio.ontimeupdate = () => {
          const percent = (audio.currentTime / audio.duration) * 100;
          setProgress(percent);
        };
        audioRef.current = audio;
      }
      audioRef.current.play();
      setIsPlaying(true);
    } else {
      // Use browser TTS as fallback
      const utterance = new SpeechSynthesisUtterance(session.script);
      const voices = window.speechSynthesis.getVoices();
      const femaleVoice = voices.find(v => 
        v.name.includes("Female") || v.name.includes("Samantha") || v.name.toLowerCase().includes("female")
      );
      if (femaleVoice) utterance.voice = femaleVoice;
      utterance.rate = 0.75;
      utterance.pitch = 1.1;
      utterance.onend = () => {
        setIsPlaying(false);
        setProgress(100);
        onComplete();
      };
      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
      
      // Simulate progress for browser TTS
      const duration = session.durationMinutes * 60 * 1000;
      const startTime = Date.now();
      intervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const percent = Math.min((elapsed / duration) * 100, 100);
        setProgress(percent);
      }, 100);
    }
  };
  
  const handlePause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    } else {
      window.speechSynthesis.pause();
    }
    setIsPlaying(false);
  };
  
  const handleClose = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    window.speechSynthesis.cancel();
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    onClose();
  };
  
  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
    }
    setIsMuted(!isMuted);
  };
  
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl bg-gradient-to-br from-purple-900/90 to-pink-900/90 text-white border-none">
        <CardContent className="pt-6">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">{session.meditationType}</h2>
              <p className="text-purple-200">{session.durationMinutes} minutes</p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleClose} className="text-white hover:bg-white/20">
              <X className="h-6 w-6" />
            </Button>
          </div>

          <div className="flex justify-center mb-8">
            <div className={`w-48 h-48 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center ${isPlaying ? "animate-pulse" : ""}`}>
              <div className="w-32 h-32 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <span className="text-6xl">🧘</span>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-400 to-pink-400 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-center text-sm text-purple-200 mt-2">
              {Math.round(progress)}% Complete
            </p>
          </div>

          <div className="flex justify-center items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMute}
              className="text-white hover:bg-white/20"
            >
              {isMuted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
            </Button>
            
            {!isPlaying ? (
              <Button
                size="lg"
                onClick={handlePlay}
                className="w-20 h-20 rounded-full bg-white text-purple-900 hover:bg-purple-100"
              >
                <Play className="h-8 w-8 ml-1" />
              </Button>
            ) : (
              <Button
                size="lg"
                onClick={handlePause}
                className="w-20 h-20 rounded-full bg-white text-purple-900 hover:bg-purple-100"
              >
                <Pause className="h-8 w-8" />
              </Button>
            )}
          </div>

          <p className="text-center text-sm text-purple-300">
            Find a comfortable position and allow yourself to relax
          </p>
          
          {!session.audioUrl && (
            <p className="text-center text-xs text-purple-400 mt-2">
              Using browser voice. For better quality, check TTS API configuration.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
