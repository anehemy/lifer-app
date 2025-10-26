import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { BookOpen, X, Sparkles, Brain, Target, User, BookMarked } from "lucide-react";
import { useState, useEffect } from "react";
import { MR_MG_AVATAR, MR_MG_NAME } from "@/const";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

export default function StartHereGuide() {
  const { user } = useAuth();
  const [showGuide, setShowGuide] = useState(false);
  const hasSeenGuide = user?.hasSeenWelcome || false;

  const markWelcomeSeen = trpc.user.markWelcomeSeen.useMutation();

  useEffect(() => {
    // Show guide if user hasn't seen it
    if (user && !user.hasSeenWelcome) {
      setShowGuide(true);
    }
  }, [user]);

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
              <CardContent className="pt-6">
                <p className="text-lg leading-relaxed">
                  Hi, I'm <strong>{MR_MG_NAME}</strong>, your life mentor. I'm here to help you discover your <strong>Primary Aim</strong> - 
                  not what you want to DO, but who you want to BE and how you want to LIVE.
                </p>
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
