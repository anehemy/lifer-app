import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { MapPin, Sparkles, Heart, TrendingUp, Calendar, HelpCircle, CheckCircle2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import ReactMarkdown from 'react-markdown';
import { calculateCompleteness } from "@shared/completeness";

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
  birthYear?: number | null;
}

type DimensionFilter = "all" | "places" | "experiences" | "challenges" | "growth";

// Extract year from text (e.g., "in 2010" or "2010")
function extractYearFromText(text: string): number | null {
  const yearMatch = text.match(/\b(19\d{2}|20\d{2})\b/);
  return yearMatch ? parseInt(yearMatch[0]) : null;
}

export default function InteractiveTimeline({ entries, birthYear }: InteractiveTimelineProps) {
  const [selectedDimension, setSelectedDimension] = useState<DimensionFilter>("all");
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  
  // Filter entries by dimension
  const filteredEntries = entries.filter(entry => {
    if (selectedDimension === "all") return true;
    if (selectedDimension === "places") return entry.placeContext;
    if (selectedDimension === "experiences") return entry.experienceType;
    if (selectedDimension === "challenges") return entry.challengeType;
    if (selectedDimension === "growth") return entry.growthTheme;
    return false;
  });
  
  // Extract all unique years from entries
  const yearsWithEntries = new Set<number>();
  
  filteredEntries.forEach(entry => {
    // Add year from createdAt
    const createdYear = new Date(entry.createdAt).getFullYear();
    yearsWithEntries.add(createdYear);
    
    // Try to extract year from timeContext (e.g., "2010", "in 2010")
    if (entry.timeContext) {
      const yearFromContext = extractYearFromText(entry.timeContext);
      if (yearFromContext) yearsWithEntries.add(yearFromContext);
    }
    
    // Try to extract year from response text
    const yearFromResponse = extractYearFromText(entry.response);
    if (yearFromResponse) yearsWithEntries.add(yearFromResponse);
  });
  
  // Convert to sorted array
  const years = Array.from(yearsWithEntries).sort((a, b) => a - b);
  
  // If no entries, show empty state
  if (years.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground">
          <Calendar className="h-16 w-16 mx-auto mb-4 opacity-30" />
          <p>Start journaling to see your timeline visualization</p>
        </CardContent>
      </Card>
    );
  }
  
  // Get entries for a specific year
  const getEntriesForYear = (year: number) => {
    return filteredEntries.filter(entry => {
      const createdYear = new Date(entry.createdAt).getFullYear();
      if (createdYear === year) return true;
      
      // Check if year is mentioned in timeContext or response
      const yearFromContext = entry.timeContext ? extractYearFromText(entry.timeContext) : null;
      const yearFromResponse = extractYearFromText(entry.response);
      
      return yearFromContext === year || yearFromResponse === year;
    });
  };
  
  // Get color based on dimension
  const getEntryColor = (entry: JournalEntry) => {
    if (entry.growthTheme) return "bg-green-500 border-green-600 hover:bg-green-600";
    if (entry.challengeType) return "bg-red-500 border-red-600 hover:bg-red-600";
    if (entry.experienceType) return "bg-yellow-500 border-yellow-600 hover:bg-yellow-600";
    if (entry.placeContext) return "bg-blue-500 border-blue-600 hover:bg-blue-600";
    return "bg-purple-500 border-purple-600 hover:bg-purple-600";
  };
  
  // Auto-scroll to most recent year on mount
  useEffect(() => {
    if (timelineRef.current && years.length > 0) {
      const mostRecentYearIndex = years.length - 1;
      const scrollPosition = mostRecentYearIndex * 200; // 200px per year marker
      timelineRef.current.scrollLeft = scrollPosition - timelineRef.current.clientWidth / 2;
    }
  }, [years]);
  
  const currentYear = new Date().getFullYear();
  
  return (
    <div className="space-y-6">
      {/* Birth Year Indicator */}
      {birthYear ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>Timeline starts from {birthYear} (your birth year)</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
          <HelpCircle className="h-4 w-4" />
          <span>Birth year not set - timeline shows years from journal entries only</span>
        </div>
      )}
      
      {/* Dimension Filters */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedDimension === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedDimension("all")}
          className="flex items-center gap-2"
        >
          <Calendar className="h-4 w-4" />
          All Events ({filteredEntries.length})
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
            className="overflow-x-auto overflow-y-hidden py-8"
            style={{ height: "250px" }}
          >
            <div 
              className="relative h-full px-8"
              style={{ 
                minWidth: `${years.length * 200}px`,
              }}
            >
              {/* Horizontal timeline line */}
              <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-purple-400 via-purple-500 to-purple-400 transform -translate-y-1/2"></div>
              
              {/* Year markers with entries */}
              {years.map((year, index) => {
                const yearEntries = getEntriesForYear(year);
                const isCurrentYear = year === currentYear;
                
                return (
                  <div
                    key={year}
                    className="absolute top-1/2 transform -translate-y-1/2"
                    style={{ left: `${index * 200 + 100}px` }}
                  >
                    {/* Year marker */}
                    <div className={`w-4 h-4 rounded-full border-2 border-white shadow-md ${isCurrentYear ? 'bg-red-500 ring-4 ring-red-300' : 'bg-purple-500'}`}></div>
                    
                    {/* Year label */}
                    <div className="absolute top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                      <div className={`text-sm font-bold ${isCurrentYear ? 'text-red-600 dark:text-red-400' : 'text-foreground'}`}>
                        {year}
                        {isCurrentYear && <span className="ml-1 text-xs">(Today)</span>}
                      </div>
                      {birthYear && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Age {year - birthYear}
                        </div>
                      )}
                    </div>
                    
                    {/* Entry dots stacked vertically */}
                    <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col-reverse gap-2">
                      {yearEntries.slice(0, 5).map((entry, entryIndex) => {
                        const completeness = calculateCompleteness({
                          timeContext: entry.timeContext,
                          placeContext: entry.placeContext,
                          experienceType: entry.experienceType,
                          challengeType: entry.challengeType,
                          growthTheme: entry.growthTheme,
                        });
                        const isComplete = completeness.percentage === 100;
                        
                        // Build tooltip content
                        const tooltipParts = [
                          entry.placeContext && `📍 ${entry.placeContext}`,
                          entry.experienceType && `✨ ${entry.experienceType}`,
                          entry.challengeType && `💪 ${entry.challengeType}`,
                          entry.growthTheme && `🌱 ${entry.growthTheme}`,
                        ].filter(Boolean);
                        
                        return (
                          <Tooltip key={entry.id}>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => setSelectedEntry(entry)}
                                className={`relative w-3 h-3 rounded-full border-2 ${getEntryColor(entry)} transition-all cursor-pointer shadow-md ${isComplete ? 'ring-2 ring-green-400' : 'opacity-60'}`}
                              >
                                {isComplete && (
                                  <CheckCircle2 className="absolute -top-1 -right-1 h-2 w-2 text-green-600 bg-white rounded-full" />
                                )}
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <div className="space-y-1">
                                <p className="font-semibold text-sm">{entry.question}</p>
                                <p className="text-xs opacity-90">
                                  {entry.response.substring(0, 100)}{entry.response.length > 100 ? '...' : ''}
                                </p>
                                {tooltipParts.length > 0 && (
                                  <div className="text-xs opacity-75 pt-1 border-t border-white/20">
                                    {tooltipParts.join(' • ')}
                                  </div>
                                )}
                                <div className="text-xs opacity-75">
                                  {completeness.percentage}% complete
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                      {yearEntries.length > 5 && (
                        <div className="text-xs text-muted-foreground text-center">
                          +{yearEntries.length - 5}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
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
                <div className="text-base leading-relaxed prose prose-sm max-w-none text-foreground/90">
                  <ReactMarkdown>{selectedEntry.response}</ReactMarkdown>
                </div>
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
              {selectedEntry.timeContext && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium">
                  <Calendar className="h-3 w-3" />
                  {selectedEntry.timeContext}
                </span>
              )}
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

