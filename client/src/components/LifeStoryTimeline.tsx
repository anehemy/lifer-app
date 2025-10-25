import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, MapPin, Sparkles, Heart, TrendingUp, Clock } from "lucide-react";
import { useState } from "react";

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

  // Helper function to extract keywords from text
  const extractKeywords = (text: string, keywords: string[]): boolean => {
    const lowerText = text.toLowerCase();
    return keywords.some(keyword => lowerText.includes(keyword.toLowerCase()));
  };

  // Categorize entries based on content
  const categorizeEntries = () => {
    const locationKeywords = ["city", "town", "place", "country", "home", "house", "school", "work", "office", "traveled", "moved", "lived"];
    const experienceKeywords = ["moment", "time", "experience", "event", "happened", "remember", "first", "last", "always", "never"];
    const challengeKeywords = ["struggle", "difficult", "hard", "pain", "loss", "trauma", "challenge", "problem", "fear", "anxiety", "depression", "failed", "mistake"];
    const growthKeywords = ["learn", "grow", "develop", "improve", "better", "understand", "realize", "discover", "change", "transform", "insight"];

    return {
      locations: entries.filter(e => extractKeywords(e.response, locationKeywords)),
      experiences: entries.filter(e => extractKeywords(e.response, experienceKeywords)),
      challenges: entries.filter(e => extractKeywords(e.response, challengeKeywords)),
      growth: entries.filter(e => extractKeywords(e.response, growthKeywords)),
    };
  };

  const categorized = categorizeEntries();

  // Group entries by year for timeline view
  const groupByYear = (entries: JournalEntry[]) => {
    const grouped: Record<string, JournalEntry[]> = {};
    entries.forEach(entry => {
      const createdDate = entry.createdAt instanceof Date ? entry.createdAt : new Date(entry.createdAt);
      const year = createdDate.getFullYear().toString();
      if (!grouped[year]) grouped[year] = [];
      grouped[year].push(entry);
    });
    return grouped;
  };

  const timelineData = groupByYear(entries);

  const renderTimelineView = () => (
    <div className="space-y-6">
      {Object.keys(timelineData).sort().reverse().map(year => (
        <div key={year} className="relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-purple-600 text-white px-4 py-2 rounded-full font-bold">
              {year}
            </div>
            <div className="flex-1 h-px bg-gradient-to-r from-purple-300 to-transparent"></div>
          </div>
          <div className="space-y-4 ml-6">
            {timelineData[year].map(entry => (
              <Card key={entry.id} className="relative before:absolute before:left-[-24px] before:top-6 before:w-3 before:h-3 before:bg-purple-400 before:rounded-full before:ring-4 before:ring-purple-100 dark:before:ring-purple-900">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-1">
                        {new Date(entry.createdAt).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                      <CardTitle className="text-base text-purple-600 dark:text-purple-400">
                        {entry.question}
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap line-clamp-3">{entry.response}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  const renderCategoryView = (categoryEntries: JournalEntry[], icon: React.ReactNode, emptyMessage: string) => (
    <div className="space-y-4">
      {categoryEntries.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            <div className="mb-3">{icon}</div>
            <p>{emptyMessage}</p>
          </CardContent>
        </Card>
      ) : (
        categoryEntries.map(entry => (
          <Card key={entry.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground mb-1">
                    {new Date(entry.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                  <CardTitle className="text-base text-purple-600 dark:text-purple-400">
                    {entry.question}
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{entry.response}</p>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Your Life Story Timeline</h2>
        <p className="text-muted-foreground">Explore your journey through different perspectives</p>
      </div>

      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="timeline" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Timeline</span>
          </TabsTrigger>
          <TabsTrigger value="locations" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span className="hidden sm:inline">Places</span>
          </TabsTrigger>
          <TabsTrigger value="experiences" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">Experiences</span>
          </TabsTrigger>
          <TabsTrigger value="challenges" className="flex items-center gap-2">
            <Heart className="h-4 w-4" />
            <span className="hidden sm:inline">Challenges</span>
          </TabsTrigger>
          <TabsTrigger value="growth" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Growth</span>
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="timeline" className="mt-0">
            {entries.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Start journaling to see your life story unfold</p>
                </CardContent>
              </Card>
            ) : (
              renderTimelineView()
            )}
          </TabsContent>

          <TabsContent value="locations" className="mt-0">
            {renderCategoryView(
              categorized.locations,
              <MapPin className="h-12 w-12 mx-auto opacity-50" />,
              "No location-related entries yet. Write about places that shaped your journey!"
            )}
          </TabsContent>

          <TabsContent value="experiences" className="mt-0">
            {renderCategoryView(
              categorized.experiences,
              <Sparkles className="h-12 w-12 mx-auto opacity-50" />,
              "No experience entries yet. Share the moments that defined you!"
            )}
          </TabsContent>

          <TabsContent value="challenges" className="mt-0">
            {renderCategoryView(
              categorized.challenges,
              <Heart className="h-12 w-12 mx-auto opacity-50" />,
              "No challenge entries yet. Reflect on the struggles that made you stronger!"
            )}
          </TabsContent>

          <TabsContent value="growth" className="mt-0">
            {renderCategoryView(
              categorized.growth,
              <TrendingUp className="h-12 w-12 mx-auto opacity-50" />,
              "No growth entries yet. Document your learning and transformation!"
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

