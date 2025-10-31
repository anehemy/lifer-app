import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, MapPin, Sparkles, Heart, TrendingUp, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import PlacesMapView from "@/components/PlacesMapView";
import ExperiencesBubbleView from "@/components/ExperiencesBubbleView";

interface JournalEntry {
  id: number;
  question: string;
  response: string;
  createdAt: string | Date;
  timeContext?: string | null;
  placeContext?: string | null;
  experienceType?: string | null;
  challengeType?: string | null;
  growthTheme?: string | null;
}

interface LifeStoryTimelineProps {
  entries: JournalEntry[];
}

type ViewMode = "timeline" | "locations" | "experiences" | "challenges" | "growth";

export default function LifeStoryTimeline({ entries }: LifeStoryTimelineProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("timeline");
  const [expandedEntries, setExpandedEntries] = useState<Set<number>>(new Set());
  const [collapsedPeriods, setCollapsedPeriods] = useState<Set<string>>(new Set());
  
  const toggleExpanded = (id: number) => {
    const newExpanded = new Set(expandedEntries);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedEntries(newExpanded);
  };

  const togglePeriodCollapse = (period: string) => {
    const newCollapsed = new Set(collapsedPeriods);
    if (newCollapsed.has(period)) {
      newCollapsed.delete(period);
    } else {
      newCollapsed.add(period);
    }
    setCollapsedPeriods(newCollapsed);
  };

  // Dynamic title based on view mode
  const getTitleAndDescription = () => {
    switch (viewMode) {
      case "timeline":
        return {
          title: "Your Life Story Timeline",
          description: "Explore your journey through different perspectives"
        };
      case "locations":
        return {
          title: "Places That Shaped You",
          description: "The locations and spaces that influenced your journey"
        };
      case "experiences":
        return {
          title: "Your Life Experiences",
          description: "The moments and events that defined who you are"
        };
      case "challenges":
        return {
          title: "Challenges You've Overcome",
          description: "The struggles that made you stronger and wiser"
        };
      case "growth":
        return {
          title: "Your Personal Growth",
          description: "The lessons learned and transformations experienced"
        };
      default:
        return {
          title: "Your Life Story Timeline",
          description: "Explore your journey through different perspectives"
        };
    }
  };
  
  const { title, description } = getTitleAndDescription();

  // Helper function to extract keywords from text
  const extractKeywords = (text: string, keywords: string[]): boolean => {
    const lowerText = text.toLowerCase();
    return keywords.some(keyword => lowerText.includes(keyword.toLowerCase()));
  };

  // Categorize entries based on metadata (with keyword fallback)
  const categorizeEntries = () => {
    const locationKeywords = ["city", "town", "place", "country", "home", "house", "school", "work", "office", "traveled", "moved", "lived"];
    const experienceKeywords = ["moment", "time", "experience", "event", "happened", "remember", "first", "last", "always", "never"];
    const challengeKeywords = ["struggle", "difficult", "hard", "pain", "loss", "trauma", "challenge", "problem", "fear", "anxiety", "depression", "failed", "mistake"];
    const growthKeywords = ["learn", "grow", "develop", "improve", "better", "understand", "realize", "discover", "change", "transform", "insight"];

    return {
      locations: entries.filter(e => e.placeContext || extractKeywords(e.response, locationKeywords)),
      experiences: entries.filter(e => e.experienceType || extractKeywords(e.response, experienceKeywords)),
      challenges: entries.filter(e => e.challengeType || extractKeywords(e.response, challengeKeywords)),
      growth: entries.filter(e => e.growthTheme || extractKeywords(e.response, growthKeywords)),
    };
  };

  const categorized = categorizeEntries();

  // Group entries by story time (timeContext) for timeline view
  const groupByStoryTime = (entries: JournalEntry[]) => {
    const grouped: Record<string, JournalEntry[]> = {};
    entries.forEach(entry => {
      // Use timeContext if available, otherwise fall back to createdAt year
      let timeLabel = "Unspecified Time";
      
      if (entry.timeContext) {
        timeLabel = entry.timeContext;
      } else {
        const createdDate = entry.createdAt instanceof Date ? entry.createdAt : new Date(entry.createdAt);
        timeLabel = createdDate.getFullYear().toString();
      }
      
      if (!grouped[timeLabel]) grouped[timeLabel] = [];
      grouped[timeLabel].push(entry);
    });
    return grouped;
  };

  const timelineData = groupByStoryTime(entries);

  const renderTimelineView = () => (
    <div className="space-y-8">
      {Object.keys(timelineData).sort().reverse().map((period, periodIndex) => (
        <div key={period} className="relative">
          {/* Timeline connector line */}
          {periodIndex < Object.keys(timelineData).length - 1 && (
            <div className="absolute left-[52px] top-[60px] bottom-[-32px] w-0.5 bg-gradient-to-b from-purple-400 via-purple-300 to-transparent dark:from-purple-600 dark:via-purple-700"></div>
          )}
          
          {/* Period header */}
          <button
            onClick={() => togglePeriodCollapse(period)}
            className="flex items-center gap-4 mb-6 w-full group hover:opacity-80 transition-opacity"
          >
            <div className="relative z-10 bg-gradient-to-r from-purple-600 to-purple-500 text-white px-6 py-3 rounded-full font-bold text-lg shadow-lg flex items-center gap-2">
              {period}
              {collapsedPeriods.has(period) ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </div>
            <div className="flex-1 h-px bg-gradient-to-r from-purple-300 via-purple-200 to-transparent dark:from-purple-600 dark:via-purple-800"></div>
            <span className="text-sm text-muted-foreground font-medium">
              {timelineData[period].length} {timelineData[period].length === 1 ? 'entry' : 'entries'}
            </span>
          </button>
          
          {/* Entries for this period */}
          {!collapsedPeriods.has(period) && (
          <div className="space-y-4 ml-12">
            {timelineData[period].map((entry, entryIndex) => {
              const isExpanded = expandedEntries.has(entry.id);
              const isLongResponse = entry.response.length > 200;
              const displayResponse = !isExpanded && isLongResponse
                ? entry.response.slice(0, 200) + "..."
                : entry.response;

              return (
                <div key={entry.id} className="relative group">
                  {/* Timeline dot */}
                  <div className="absolute left-[-36px] top-6 w-4 h-4 bg-white dark:bg-gray-900 rounded-full ring-4 ring-purple-400 dark:ring-purple-600 z-10 group-hover:ring-purple-500 transition-all"></div>
                  
                  <Card className="transition-all duration-200 hover:shadow-md border-l-4 border-l-purple-400">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
                            <Clock className="h-3 w-3" />
                            {new Date(entry.createdAt).toLocaleDateString("en-US", {
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                          <CardTitle className="text-base font-semibold text-purple-600 dark:text-purple-400 leading-relaxed">
                            {entry.question}
                          </CardTitle>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm whitespace-pre-wrap leading-relaxed text-foreground/90">
                        {displayResponse}
                      </p>
                      {isLongResponse && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpanded(entry.id)}
                          className="mt-2 text-purple-600 hover:text-purple-700 h-auto p-1"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="h-3.5 w-3.5 mr-1" />
                              <span className="text-xs">Show less</span>
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-3.5 w-3.5 mr-1" />
                              <span className="text-xs">Read more</span>
                            </>
                          )}
                        </Button>
                      )}
                      
                      {/* Context tags */}
                      {(entry.placeContext || entry.experienceType || entry.challengeType || entry.growthTheme) && (
                        <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t">
                          {entry.placeContext && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs">
                              <MapPin className="h-2.5 w-2.5" />
                              {entry.placeContext}
                            </span>
                          )}
                          {entry.experienceType && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full text-xs">
                              <Sparkles className="h-2.5 w-2.5" />
                              {entry.experienceType}
                            </span>
                          )}
                          {entry.challengeType && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-xs">
                              <Heart className="h-2.5 w-2.5" />
                              {entry.challengeType}
                            </span>
                          )}
                          {entry.growthTheme && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs">
                              <TrendingUp className="h-2.5 w-2.5" />
                              {entry.growthTheme}
                            </span>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
          )}
        </div>
      ))}
    </div>
  );

  const renderCategoryView = (categoryEntries: JournalEntry[], icon: React.ReactNode, emptyMessage: string) => (
    <div className="space-y-4">
      {categoryEntries.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="pt-12 pb-12 text-center text-muted-foreground">
            <div className="mb-4 flex justify-center opacity-40">{icon}</div>
            <p className="text-sm">{emptyMessage}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="text-sm text-muted-foreground mb-4">
            {categoryEntries.length} {categoryEntries.length === 1 ? 'entry' : 'entries'} found
          </div>
          {categoryEntries.map(entry => {
            const isExpanded = expandedEntries.has(entry.id);
            const isLongResponse = entry.response.length > 200;
            const displayResponse = !isExpanded && isLongResponse
              ? entry.response.slice(0, 200) + "..."
              : entry.response;

            return (
              <Card key={entry.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-2">
                        {new Date(entry.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                      <CardTitle className="text-base font-semibold text-purple-600 dark:text-purple-400">
                        {entry.question}
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{displayResponse}</p>
                  {isLongResponse && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpanded(entry.id)}
                      className="mt-2 text-purple-600 hover:text-purple-700 h-auto p-1"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="h-3.5 w-3.5 mr-1" />
                          <span className="text-xs">Show less</span>
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-3.5 w-3.5 mr-1" />
                          <span className="text-xs">Read more</span>
                        </>
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent">
          {title}
        </h2>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>

      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)} className="w-full">
        <TabsList className="grid w-full grid-cols-5 h-auto">
          <TabsTrigger value="timeline" className="flex flex-col sm:flex-row items-center gap-1.5 py-2">
            <Clock className="h-4 w-4" />
            <span className="text-xs sm:text-sm">Timeline</span>
          </TabsTrigger>
          <TabsTrigger value="locations" className="flex flex-col sm:flex-row items-center gap-1.5 py-2">
            <MapPin className="h-4 w-4" />
            <span className="text-xs sm:text-sm">Places</span>
          </TabsTrigger>
          <TabsTrigger value="experiences" className="flex flex-col sm:flex-row items-center gap-1.5 py-2">
            <Sparkles className="h-4 w-4" />
            <span className="text-xs sm:text-sm">Experiences</span>
          </TabsTrigger>
          <TabsTrigger value="challenges" className="flex flex-col sm:flex-row items-center gap-1.5 py-2">
            <Heart className="h-4 w-4" />
            <span className="text-xs sm:text-sm">Challenges</span>
          </TabsTrigger>
          <TabsTrigger value="growth" className="flex flex-col sm:flex-row items-center gap-1.5 py-2">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs sm:text-sm">Growth</span>
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="timeline" className="mt-0">
            {entries.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="pt-16 pb-16 text-center text-muted-foreground">
                  <Calendar className="h-16 w-16 mx-auto mb-4 opacity-30" />
                  <h3 className="font-semibold text-lg mb-2">Your Story Begins Here</h3>
                  <p className="text-sm max-w-md mx-auto">
                    Start journaling to see your life story unfold. Answer questions from Mr. MG to build your timeline.
                  </p>
                </CardContent>
              </Card>
            ) : (
              renderTimelineView()
            )}
          </TabsContent>

          <TabsContent value="locations" className="mt-0">
            <PlacesMapView entries={entries} />
          </TabsContent>

          <TabsContent value="experiences" className="mt-0">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-purple-900 dark:text-purple-100 mb-2">
                Your Life Experiences
              </h2>
              <p className="text-muted-foreground">
                Drag bubbles to group related experiences. Watch colors blend and shift as you explore connections.
              </p>
            </div>
            <ExperiencesBubbleView entries={entries} />
          </TabsContent>

          <TabsContent value="challenges" className="mt-0">
            {renderCategoryView(
              categorized.challenges,
              <Heart className="h-16 w-16 mx-auto" />,
              "No challenge entries yet. Reflect on the struggles that made you stronger!"
            )}
          </TabsContent>

          <TabsContent value="growth" className="mt-0">
            {renderCategoryView(
              categorized.growth,
              <TrendingUp className="h-16 w-16 mx-auto" />,
              "No growth entries yet. Document your learning and transformation!"
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

