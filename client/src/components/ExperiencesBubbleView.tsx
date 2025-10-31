import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

interface JournalEntry {
  id: number;
  question: string;
  response: string;
  experienceType?: string | null;
  createdAt: Date | string;
}

interface ExperiencesBubbleViewProps {
  entries: JournalEntry[];
}

interface Bubble {
  experience: string;
  count: number;
  entries: JournalEntry[];
  x: number;
  y: number;
}

// Convert position to color using HSL
const positionToColor = (x: number, y: number, canvasWidth: number, canvasHeight: number) => {
  // Hue based on X position (0-360 degrees)
  const hue = (x / canvasWidth) * 360;
  
  // Saturation based on Y position (40-90%)
  const saturation = 40 + (y / canvasHeight) * 50;
  
  // Lightness varies with position (45-75%)
  const lightness = 45 + ((x + y) / (canvasWidth + canvasHeight)) * 30;
  
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

// Calculate color influence from nearby bubbles
const calculateProximityColor = (
  bubble: Bubble,
  allBubbles: Bubble[],
  canvasWidth: number,
  canvasHeight: number
) => {
  const baseColor = positionToColor(bubble.x, bubble.y, canvasWidth, canvasHeight);
  
  // Find nearby bubbles (within 150px)
  const nearbyBubbles = allBubbles.filter(other => {
    if (other.experience === bubble.experience) return false;
    const distance = Math.sqrt(
      Math.pow(bubble.x - other.x, 2) + Math.pow(bubble.y - other.y, 2)
    );
    return distance < 150;
  });
  
  if (nearbyBubbles.length === 0) return baseColor;
  
  // Blend colors based on proximity
  // For now, just shift hue slightly based on nearby bubbles
  const hueMatch = baseColor.match(/hsl\((\d+),/);
  if (!hueMatch) return baseColor;
  
  let hue = parseInt(hueMatch[1]);
  const satMatch = baseColor.match(/,\s*(\d+)%/);
  const lightMatch = baseColor.match(/,\s*(\d+)%\)/);
  
  if (!satMatch || !lightMatch) return baseColor;
  
  const sat = parseInt(satMatch[1]);
  const light = parseInt(lightMatch[1]);
  
  // Shift hue based on number of nearby bubbles
  hue = (hue + nearbyBubbles.length * 15) % 360;
  
  return `hsl(${hue}, ${sat}%, ${light}%)`;
};

export default function ExperiencesBubbleView({ entries }: ExperiencesBubbleViewProps) {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [selectedBubble, setSelectedBubble] = useState<string | null>(null);

  // Group entries by experience type
  useEffect(() => {
    const experienceMap = new Map<string, JournalEntry[]>();
    
    entries.forEach(entry => {
      if (!entry.experienceType) return;
      
      const experiences = entry.experienceType
        .split(',')
        .map(e => e.trim())
        .filter(e => e.length > 0);
      
      experiences.forEach(exp => {
        if (!experienceMap.has(exp)) {
          experienceMap.set(exp, []);
        }
        experienceMap.get(exp)!.push(entry);
      });
    });

    // Create bubbles with random initial positions
    const newBubbles: Bubble[] = Array.from(experienceMap.entries()).map(([experience, entries]) => ({
      experience,
      count: entries.length,
      entries,
      x: Math.random() * (canvasSize.width - 100) + 50,
      y: Math.random() * (canvasSize.height - 100) + 50,
    }));

    setBubbles(newBubbles);
  }, [entries, canvasSize.width, canvasSize.height]);

  const handleDrag = (experience: string, x: number, y: number) => {
    setBubbles(prev =>
      prev.map(bubble =>
        bubble.experience === experience
          ? { ...bubble, x, y }
          : bubble
      )
    );
  };

  if (bubbles.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="pt-12 pb-12 text-center text-muted-foreground">
          <div className="mb-4 flex justify-center opacity-40">
            <Sparkles className="h-16 w-16" />
          </div>
          <p className="text-sm">
            No experiences found yet. Start journaling to see your experiences visualized as interactive bubbles!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        {bubbles.length} {bubbles.length === 1 ? 'experience' : 'experiences'} • Drag bubbles to arrange and watch colors change
      </div>

      {/* Canvas */}
      <Card className="overflow-hidden">
        <div 
          className="relative bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20"
          style={{ height: `${canvasSize.height}px` }}
        >
          {bubbles.map((bubble) => {
            const size = Math.min(40 + bubble.count * 15, 120);
            const color = calculateProximityColor(bubble, bubbles, canvasSize.width, canvasSize.height);
            
            return (
              <motion.div
                key={bubble.experience}
                drag
                dragMomentum={false}
                dragElastic={0.1}
                onDrag={(_, info) => {
                  const newX = Math.max(size / 2, Math.min(canvasSize.width - size / 2, bubble.x + info.delta.x));
                  const newY = Math.max(size / 2, Math.min(canvasSize.height - size / 2, bubble.y + info.delta.y));
                  handleDrag(bubble.experience, newX, newY);
                }}
                style={{
                  position: 'absolute',
                  left: bubble.x - size / 2,
                  top: bubble.y - size / 2,
                  width: size,
                  height: size,
                }}
                className="cursor-grab active:cursor-grabbing"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <div
                  className="w-full h-full rounded-full flex items-center justify-center text-white font-medium shadow-lg transition-all duration-300 hover:shadow-xl"
                  style={{
                    backgroundColor: color,
                    fontSize: `${Math.max(10, size / 8)}px`,
                  }}
                  onClick={() => setSelectedBubble(
                    selectedBubble === bubble.experience ? null : bubble.experience
                  )}
                >
                  <div className="text-center px-2">
                    <div className="font-semibold leading-tight" style={{ fontSize: `${Math.max(10, size / 7)}px` }}>
                      {bubble.experience}
                    </div>
                    <div className="text-xs opacity-90 mt-1">
                      {bubble.count}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </Card>

      {/* Selected bubble details */}
      {selectedBubble && (
        <Card className="border-purple-200 bg-purple-50/50 dark:bg-purple-950/20">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              {selectedBubble}
            </h3>
            <div className="space-y-2">
              {bubbles
                .find(b => b.experience === selectedBubble)
                ?.entries.slice(0, 3)
                .map(entry => (
                  <div key={entry.id} className="text-sm border-l-2 border-purple-300 pl-3 py-1">
                    <p className="font-medium text-purple-800 dark:text-purple-200">
                      {entry.question}
                    </p>
                    <p className="text-muted-foreground mt-1 line-clamp-2">
                      {entry.response}
                    </p>
                  </div>
                ))}
              {bubbles.find(b => b.experience === selectedBubble)!.entries.length > 3 && (
                <p className="text-xs text-muted-foreground italic">
                  +{bubbles.find(b => b.experience === selectedBubble)!.entries.length - 3} more entries
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

