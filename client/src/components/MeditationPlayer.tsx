import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, X, Volume2, VolumeX } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";

interface MeditationPlayerProps {
  meditation: {
    id: string;
    title: string;
    duration: number;
    description: string;
  };
  onClose: () => void;
  onComplete: () => void;
}

export default function MeditationPlayer({ meditation, onClose, onComplete }: MeditationPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentText, setCurrentText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const scriptRef = useRef<string>("");

  const generateScript = trpc.meditation.generateScript.useMutation({
    onSuccess: (data) => {
      scriptRef.current = data.script;
      setCurrentText("Ready to begin...");
      setIsLoading(false);
    },
    onError: () => {
      setCurrentText("Failed to generate meditation. Please try again.");
      setIsLoading(false);
    },
  });

  useEffect(() => {
    generateScript.mutate({
      meditationType: meditation.title,
      duration: meditation.duration,
    });

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speak = (text: string) => {
    if (!window.speechSynthesis) {
      setCurrentText("Text-to-speech not supported in this browser");
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.8; // Slower, calmer pace
    utterance.pitch = 1.0;
    utterance.volume = isMuted ? 0 : 1;
    
    utterance.onend = () => {
      setProgress(100);
      setIsPlaying(false);
      onComplete();
    };

    utterance.onboundary = (event) => {
      // Update current text being spoken
      const spokenText = text.substring(0, event.charIndex + 50);
      setCurrentText(spokenText);
      
      // Update progress
      const progressPercent = (event.charIndex / text.length) * 100;
      setProgress(progressPercent);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const handlePlayPause = () => {
    if (isLoading || !scriptRef.current) return;

    if (isPlaying) {
      window.speechSynthesis.pause();
      setIsPlaying(false);
    } else {
      if (progress === 0) {
        // Start from beginning
        speak(scriptRef.current);
      } else {
        window.speechSynthesis.resume();
      }
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (utteranceRef.current) {
      utteranceRef.current.volume = isMuted ? 1 : 0;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl bg-gradient-to-br from-purple-900/90 to-pink-900/90 text-white border-none">
        <CardContent className="pt-6">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">{meditation.title}</h2>
              <p className="text-purple-200">{meditation.duration} minutes</p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20">
              <X className="h-6 w-6" />
            </Button>
          </div>

          {/* Breathing Circle Animation */}
          <div className="flex justify-center mb-8">
            <div className={`w-48 h-48 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center ${isPlaying ? 'animate-pulse-slow' : ''}`}>
              <div className="w-32 h-32 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <span className="text-2xl">🧘</span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-400 to-pink-400 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-center text-sm text-purple-200 mt-2">
              {Math.round(progress)}% Complete
            </p>
          </div>

          {/* Current Text Display */}
          <div className="mb-8 min-h-[100px]">
            <p className="text-center text-lg leading-relaxed text-purple-100">
              {isLoading ? "Generating your personalized meditation..." : currentText}
            </p>
          </div>

          {/* Controls */}
          <div className="flex justify-center items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMute}
              className="text-white hover:bg-white/20"
            >
              {isMuted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
            </Button>
            
            <Button
              size="lg"
              onClick={handlePlayPause}
              disabled={isLoading}
              className="w-20 h-20 rounded-full bg-white text-purple-900 hover:bg-purple-100"
            >
              {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8 ml-1" />}
            </Button>
          </div>

          <p className="text-center text-sm text-purple-300 mt-6">
            Find a comfortable position and allow yourself to relax
          </p>
        </CardContent>
      </Card>

      <style>{`
        @keyframes pulse-slow {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
