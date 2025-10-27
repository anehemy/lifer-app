import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { BookOpen, X, Sparkles, Brain, Target, User, BookMarked, Play, Pause, RotateCcw } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { MR_MG_AVATAR, MR_MG_NAME } from "@/const";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

export default function StartHereGuide() {
  const { user } = useAuth();
  const [showGuide, setShowGuide] = useState(false);
  const hasSeenGuide = user?.hasSeenWelcome || false;
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const audioRef = useRef<HTMLAudioElement>(null);

  const markWelcomeSeen = trpc.user.markWelcomeSeen.useMutation();

  useEffect(() => {
    // Show guide if user hasn't seen it
    if (user && !user.hasSeenWelcome) {
      setShowGuide(true);
    }
  }, [user]);

  // Auto-play audio when dialog opens for first-time users
  useEffect(() => {
    if (showGuide && !hasSeenGuide && audioRef.current) {
      // Small delay to ensure audio element is ready
      const timer = setTimeout(() => {
        audioRef.current?.play().catch(err => {
          // Browser may block auto-play, that's okay
          console.log('Auto-play prevented:', err);
        });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [showGuide, hasSeenGuide]);

  const handleClose = () => {
    setShowGuide(false);
    markWelcomeSeen.mutate();
  };

  return (
    <>
      {/* Show Guide Button (after first time) */}
      {hasSeenGuide && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowGuide(true)}
          className="gap-2"
        >
          <BookOpen className="h-4 w-4" />
          Start Here Guide
        </Button>
      )}

      {/* Guide Dialog */}
      <Dialog open={showGuide} onOpenChange={setShowGuide}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-4xl">{MR_MG_AVATAR}</span>
              <div>
                <DialogTitle className="text-2xl">Welcome to Lifer App!</DialogTitle>
                <DialogDescription className="text-base mt-1">
                  Your journey to discovering your Primary Aim starts here
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200">
              <CardContent className="pt-6 space-y-4">
                <p className="text-lg leading-relaxed">
                  Hi, I'm <strong>{MR_MG_NAME}</strong> — the AI avatar of <strong>Michael E. Gerber</strong>, author of The E-Myth and our business partner. 
                  I'm here to help you answer two fundamental questions: <strong>Who am I?</strong> and <strong>What do I want?</strong> Together, these answers form your <strong>Primary Aim</strong>.
                </p>
                
                {/* Audio Player */}
                <div className="p-4 bg-gradient-to-r from-purple-100 via-pink-100 to-blue-100 dark:from-purple-900/30 dark:via-pink-900/30 dark:to-blue-900/30 rounded-lg border-2 border-purple-300 dark:border-purple-700">
                  <audio 
                    ref={audioRef} 
                    src={localStorage.getItem('introAudioUrl') || "/MichaelMrMGIntroV1.mp3"}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onEnded={() => {
                      setIsPlaying(false);
                      // Auto-navigate to Life Story after audio finishes for first-time users
                      if (!hasSeenGuide) {
                        setTimeout(() => {
                          setShowGuide(false);
                          markWelcomeSeen.mutate();
                          window.location.href = '/journal';
                        }, 1000);
                      }
                    }}
                    onLoadedMetadata={() => {
                      if (audioRef.current) {
                        audioRef.current.playbackRate = playbackSpeed;
                      }
                    }}
                  />
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      className="bg-white/80 hover:bg-white dark:bg-gray-800/80 dark:hover:bg-gray-800"
                      onClick={() => {
                        if (isPlaying) {
                          audioRef.current?.pause();
                        } else {
                          audioRef.current?.play();
                        }
                      }}
                    >
                      {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="hover:bg-white/50 dark:hover:bg-gray-800/50"
                      onClick={() => {
                        if (audioRef.current) {
                          audioRef.current.currentTime = 0;
                          audioRef.current.play();
                        }
                      }}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium flex-1">Listen to Mr. MG's introduction</span>
                    <select
                      value={playbackSpeed}
                      onChange={(e) => {
                        const speed = parseFloat(e.target.value);
                        setPlaybackSpeed(speed);
                        if (audioRef.current) {
                          audioRef.current.playbackRate = speed;
                        }
                      }}
                      className="px-3 py-1 text-sm rounded-md border border-purple-300 bg-white/80 dark:bg-gray-800/80 dark:border-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="0.75">0.75x</option>
                      <option value="1">1x</option>
                      <option value="1.25">1.25x</option>
                      <option value="1.5">1.5x</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div>
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                How to Use This App
              </h3>
              
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <BookMarked className="h-5 w-5 text-blue-500" />
                      1. Start with Your Life Story
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Answer guided Socratic questions about your life experiences, values, and aspirations. 
                      These reflections are the foundation of your journey.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Brain className="h-5 w-5 text-purple-500" />
                      2. Explore Pattern Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      I'll analyze your journal entries to reveal recurring themes and patterns. 
                      These insights help you see yourself more clearly.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-pink-500" />
                      3. Build Your Vision Board
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Create a visual representation of your dreams and aspirations. 
                      Add affirmations and descriptions to make them feel real.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <User className="h-5 w-5 text-green-500" />
                      4. Practice Meditation
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Use guided meditations to connect with your deeper self. 
                      Track your practice and see how it supports your journey.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Target className="h-5 w-5 text-orange-500" />
                      5. Craft Your Primary Aim
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Fill out the reflection sections, then let me help you synthesize everything 
                      into a powerful Primary Aim Statement - your life's compass.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            <Card className="border-2 border-primary/30">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{MR_MG_AVATAR}</span>
                  <div>
                    <p className="font-semibold mb-2">💬 Chat with AI Assistants</p>
                    <p className="text-sm text-muted-foreground">
                      Click the purple chat button in the bottom-right corner anytime to talk with me or other AI assistants. 
                      We have full access to your journey and can provide personalized guidance.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-3 pt-4">
              <Button onClick={handleClose} size="lg">
                Let's Begin! 🚀
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
