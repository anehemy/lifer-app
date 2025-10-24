import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MR_MG_AVATAR, MR_MG_NAME } from "@/const";
import { Play, Clock } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import MeditationPlayer from "@/components/MeditationPlayer";

const meditations = [
  { id: "primary-aim", title: "Primary Aim Discovery", duration: 15, description: "Connect with your life's deeper purpose" },
  { id: "living-aim", title: "Living Your Aim", duration: 10, description: "Visualize yourself living your Primary Aim daily" },
  { id: "pattern-integration", title: "Pattern Integration", duration: 12, description: "Understand how your patterns serve your purpose" },
  { id: "self-love", title: "Self-Love & Acceptance", duration: 10, description: "Embrace yourself with compassion" },
  { id: "manifestation", title: "Manifestation Visualization", duration: 15, description: "Deeply embody your vision and goals" },
  { id: "stress-release", title: "Stress Release", duration: 10, description: "Release tension and find inner calm" },
];

export default function Meditation() {
  const utils = trpc.useUtils();
  const { data: sessions = [] } = trpc.meditation.list.useQuery();
  const [activeMeditation, setActiveMeditation] = useState<typeof meditations[0] | null>(null);
  
  const createSession = trpc.meditation.create.useMutation({
    onSuccess: () => {
      toast.success("Meditation session recorded!");
      utils.meditation.list.invalidate();
    },
  });

  const handleStart = (meditation: typeof meditations[0]) => {
    setActiveMeditation(meditation);
  };

  const handleComplete = () => {
    if (activeMeditation) {
      createSession.mutate({
        meditationType: activeMeditation.title,
        durationMinutes: activeMeditation.duration,
      });
    }
    setActiveMeditation(null);
  };

  const totalMinutes = sessions.reduce((sum, s) => sum + s.durationMinutes, 0);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-4xl font-bold mb-2">Guided Meditation</h1>
        <p className="text-muted-foreground">Find your center with {MR_MG_NAME}</p>
      </div>

      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="text-4xl">{MR_MG_AVATAR}</div>
            <div>
              <CardTitle className="mb-2">{MR_MG_NAME} says:</CardTitle>
              <p className="text-lg">
                Meditation helps you connect with your deeper self—the part of you that knows your Primary Aim.
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {totalMinutes > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total Meditation Time</p>
              <p className="text-4xl font-bold text-primary">{totalMinutes} minutes</p>
              <p className="text-sm text-muted-foreground mt-1">{sessions.length} sessions completed</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {meditations.map((meditation) => (
          <Card key={meditation.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>{meditation.title}</CardTitle>
              <CardDescription>{meditation.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{meditation.duration} minutes</span>
                </div>
                <Button onClick={() => handleStart(meditation)}>
                  <Play className="h-4 w-4 mr-2" />
                  Start
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {activeMeditation && (
        <MeditationPlayer
          meditation={activeMeditation}
          onClose={() => setActiveMeditation(null)}
          onComplete={handleComplete}
        />
      )}
    </div>
  );
}
