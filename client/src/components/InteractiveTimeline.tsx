import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Sparkles, Heart, TrendingUp, Calendar } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface JournalEntry {
  id: number;
  question: string;
  response: string;
  createdAt: Date;
  timeContext?: string | null;
  placeContext?: string | null;
  experienceType?: string | null;
  challengeType?: string | null;
  growthTheme?: string | null;
}

interface InteractiveTimelineProps {
  entries: JournalEntry[];
  birthYear?: number;
}

type DimensionFilter = "all" | "places" | "experiences" | "challenges" | "growth";

export default function InteractiveTimeline({ entries, birthYear }: InteractiveTimelineProps) {
  // Calculate birth year from earliest entry or use default
  const calculatedBirthYear = birthYear || (() => {
    if (entries.length === 0) return new Date().getFullYear() - 30; // Default to 30 years ago
    
    const earliestYear = Math.min(...entries.map(e => new Date(e.createdAt).getFullYear()));
    // Assume earliest entry is from at least age 10, so birth year is earliestYear - 10
    return earliestYear - 20; // Conservative estimate
  })();
  
  const actualBirthYear = calculatedBirthYear;
  const [selectedDimension, setSelectedDimension] = useState<DimensionFilter>("all");
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  
  // Calculate year range
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - actualBirthYear + 1 }, (_, i) => actualBirthYear + i);
  
  // Filter entries by dimension
  const filteredEntries = entries.filter(entry => {
    if (selectedDimension === "all") return true;
    if (selectedDimension === "places") return entry.placeContext;
    if (selectedDimension === "experiences") return entry.experienceType;
    if (selectedDimension === "challenges") return entry.challengeType;
    if (selectedDimension === "growth") return entry.growthTheme;
    return false;
  });
  
  // Position entries on timeline
  const getEntryPosition = (entry: JournalEntry) => {
    const entryYear = new Date(entry.createdAt).getFullYear();
    const yearIndex = entryYear - actualBirthYear;
    const totalYears = currentYear - actualBirthYear;
    return (yearIndex / totalYears) * 100;
  };
  
  // Get color based on dimension
  const getEntryColor = (entry: JournalEntry) => {
    if (entry.growthTheme) return "bg-green-500 border-green-600";
    if (entry.challengeType) return "bg-red-500 border-red-600";
    if (entry.experienceType) return "bg-yellow-500 border-yellow-600";
    if (entry.placeContext) return "bg-blue-500 border-blue-600";
    return "bg-purple-500 border-purple-600";
  };
  
  // Auto-scroll to current year on mount
  useEffect(() => {
    if (timelineRef.current) {
      const currentYearPosition = ((currentYear - actualBirthYear) / (currentYear - actualBirthYear)) * timelineRef.current.scrollWidth;
      timelineRef.current.scrollLeft = currentYearPosition - timelineRef.current.clientWidth / 2;
    }
  }, [actualBirthYear, currentYear]);
  
  return (
    <div className="space-y-6">
      {/* Dimension Filters */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedDimension === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedDimension("all")}
          className="flex items-center gap-2"
        >
          <Calendar className="h-4 w-4" />
          All Events
        </Button>
        <Button
          variant={selectedDimension === "places" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedDimension("places")}
          className="flex items-center gap-2"
        >
          <MapPin className="h-4 w-4" />
          Places
        </Button>
        <Button
          variant={selectedDimension === "experiences" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedDimension("experiences")}
          className="flex items-center gap-2"
        >
          <Sparkles className="h-4 w-4" />
          Experiences
        </Button>
        <Button
          variant={selectedDimension === "challenges" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedDimension("challenges")}
          className="flex items-center gap-2"
        >
          <Heart className="h-4 w-4" />
          Challenges
        </Button>
        <Button
          variant={selectedDimension === "growth" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedDimension("growth")}
          className="flex items-center gap-2"
        >
          <TrendingUp className="h-4 w-4" />
          Growth
        </Button>
      </div>
      
      {/* Timeline Container */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div 
            ref={timelineRef}
            className="overflow-x-auto overflow-y-hidden"
            style={{ height: "300px" }}
          >
            <div 
              className="relative h-full"
              style={{ 
                minWidth: `${years.length * 120}px`,
                backgroundImage: "linear-gradient(to right, rgba(168, 85, 247, 0.1) 1px, transparent 1px)",
                backgroundSize: "120px 100%"
              }}
            >
              {/* Horizontal timeline line */}
              <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-purple-400 via-purple-500 to-purple-400"></div>
              
              {/* Year markers */}
              {years.map((year, index) => (
                <div
                  key={year}
                  className="absolute top-1/2 transform -translate-y-1/2"
                  style={{ left: `${index * 120}px` }}
                >
                  {/* Year marker dot */}
                  <div className="w-3 h-3 bg-purple-500 rounded-full border-2 border-white shadow-md"></div>
                  
                  {/* Year label */}
                  <div className="absolute top-8 left-1/2 transform -translate-x-1/2 text-xs font-medium text-muted-foreground whitespace-nowrap">
                    {year}
                  </div>
                  
                  {/* Age label */}
                  <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-muted-foreground/70 whitespace-nowrap">
                    Age {year - actualBirthYear}
                  </div>
                </div>
              ))}
              
              {/* Entry markers */}
              {filteredEntries.map((entry) => {
                const entryYear = new Date(entry.createdAt).getFullYear();
                const yearIndex = entryYear - actualBirthYear;
                const leftPosition = yearIndex * 120;
                
                return (
                  <div
                    key={entry.id}
                    className="absolute top-1/2 transform -translate-y-1/2 cursor-pointer group"
                    style={{ left: `${leftPosition}px` }}
                    onClick={() => setSelectedEntry(entry)}
                  >
                    {/* Entry dot */}
                    <div 
                      className={`w-4 h-4 rounded-full border-2 ${getEntryColor(entry)} shadow-lg group-hover:scale-150 transition-transform z-10`}
                    ></div>
                    
                    {/* Hover preview */}
                    <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-3 min-w-[200px] max-w-[300px] border">
                        <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 mb-1">
                          {entry.question}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {entry.response}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {/* Current year indicator */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-red-500 opacity-50"
                style={{ left: `${(currentYear - actualBirthYear) * 120}px` }}
              >
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 text-xs font-bold text-red-600 whitespace-nowrap">
                  Today
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Selected Entry Detail */}
      {selectedEntry && (
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">
                  {new Date(selectedEntry.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
                <h3 className="text-lg font-semibold text-purple-600 dark:text-purple-400 mb-2">
                  {selectedEntry.question}
                </h3>
                <p className="text-base leading-relaxed text-foreground/90">
                  {selectedEntry.response}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedEntry(null)}
              >
                Close
              </Button>
            </div>
            
            {/* Tags */}
            <div className="flex flex-wrap gap-2 mt-4">
              {selectedEntry.placeContext && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">
                  <MapPin className="h-3 w-3" />
                  {selectedEntry.placeContext}
                </span>
              )}
              {selectedEntry.experienceType && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full text-xs font-medium">
                  <Sparkles className="h-3 w-3" />
                  {selectedEntry.experienceType}
                </span>
              )}
              {selectedEntry.challengeType && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-xs font-medium">
                  <Heart className="h-3 w-3" />
                  {selectedEntry.challengeType}
                </span>
              )}
              {selectedEntry.growthTheme && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-medium">
                  <TrendingUp className="h-3 w-3" />
                  {selectedEntry.growthTheme}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span>Places</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <span>Experiences</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span>Challenges</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span>Growth</span>
        </div>
      </div>
    </div>
  );
}

