import { Card, CardHeader, CardContent } from "@/components/ui/card";
import ReactMarkdown from 'react-markdown';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Edit2, Save, X, Clock, MapPin, Sparkles, Heart, TrendingUp, ChevronDown, ChevronUp, MessageCircle } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

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

interface JournalEntryCardProps {
  entry: JournalEntry;
  onDelete: () => void;
}

export default function JournalEntryCard({ entry, onDelete }: JournalEntryCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [metadata, setMetadata] = useState({
    timeContext: entry.timeContext || "",
    placeContext: entry.placeContext || "",
    experienceType: entry.experienceType || "",
    challengeType: entry.challengeType || "",
    growthTheme: entry.growthTheme || "",
  });
  const [responseText, setResponseText] = useState(entry.response);

  const utils = trpc.useUtils();
  const updateMetadata = trpc.journal.updateMetadata.useMutation({
    onSuccess: () => {
      utils.journal.list.invalidate();
      toast.success("Metadata updated");
      setIsEditing(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update metadata");
    },
  });

  const updateEntry = trpc.journal.update.useMutation({
    onSuccess: () => {
      utils.journal.list.invalidate();
      toast.success("Entry updated");
      setIsEditing(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update entry");
    },
  });

  const handleSave = () => {
    updateEntry.mutate({
      id: entry.id,
      response: responseText,
      timeContext: metadata.timeContext || null,
      placeContext: metadata.placeContext || null,
      experienceType: metadata.experienceType || null,
      challengeType: metadata.challengeType || null,
      growthTheme: metadata.growthTheme || null,
    });
  };

  const handleCancel = () => {
    setMetadata({
      timeContext: entry.timeContext || "",
      placeContext: entry.placeContext || "",
      experienceType: entry.experienceType || "",
      challengeType: entry.challengeType || "",
      growthTheme: entry.growthTheme || "",
    });
    setResponseText(entry.response);
    setIsEditing(false);
  };

  // Determine if response is long enough to need expansion
  const isLongResponse = entry.response.length > 300;
  const displayResponse = !isExpanded && isLongResponse && !isEditing
    ? entry.response.slice(0, 300) + "..."
    : entry.response;

  // Get theme color based on entry type
  const getThemeColor = () => {
    if (entry.growthTheme) return "border-l-green-500";
    if (entry.challengeType) return "border-l-red-500";
    if (entry.experienceType) return "border-l-yellow-500";
    return "border-l-purple-500";
  };

  return (
    <Card className={`transition-all duration-200 hover:shadow-lg border-l-4 ${getThemeColor()} group`}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            {/* Date */}
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-xs text-muted-foreground font-medium">
                {new Date(entry.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>

            {/* Question - Larger and more prominent */}
            <h3 className="text-lg font-semibold text-purple-600 dark:text-purple-400 mb-4 leading-relaxed">
              {entry.question}
            </h3>

            {/* Response */}
            {isEditing ? (
              <textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                className="w-full p-4 border rounded-lg text-base min-h-[150px] mb-4 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter your response..."
              />
            ) : (
              <div className="mb-4">
                <div className="text-base leading-relaxed prose prose-sm max-w-none text-foreground/90">
                  <ReactMarkdown>{displayResponse}</ReactMarkdown>
                </div>
                {isLongResponse && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="mt-2 text-purple-600 hover:text-purple-700"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="h-4 w-4 mr-1" />
                        Show less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4 mr-1" />
                        Read more
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}

            {/* Quick context tags - visible without expanding */}
            {!isEditing && (entry.timeContext || entry.placeContext || entry.experienceType) && (
              <div className="flex flex-wrap gap-2 mb-4">
                {entry.timeContext && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium">
                    <Clock className="h-3 w-3" />
                    {entry.timeContext}
                  </span>
                )}
                {entry.placeContext && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">
                    <MapPin className="h-3 w-3" />
                    {entry.placeContext}
                  </span>
                )}
                {entry.experienceType && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full text-xs font-medium">
                    <Sparkles className="h-3 w-3" />
                    {entry.experienceType}
                  </span>
                )}
                {entry.challengeType && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-xs font-medium">
                    <Heart className="h-3 w-3" />
                    {entry.challengeType}
                  </span>
                )}
                {entry.growthTheme && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-medium">
                    <TrendingUp className="h-3 w-3" />
                    {entry.growthTheme}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {!isEditing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="h-8 w-8 p-0"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* Expandable metadata section */}
      {isEditing && (
        <CardContent className="pt-0">
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold text-muted-foreground">Context & Themes</h4>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancel}
                  disabled={updateMetadata.isPending}
                >
                  <X className="h-3 w-3 mr-1" />
                  Cancel
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSave}
                  disabled={updateMetadata.isPending}
                >
                  <Save className="h-3 w-3 mr-1" />
                  Save
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Time Context */}
              <div className="space-y-2">
                <Label htmlFor={`time-${entry.id}`} className="text-xs flex items-center gap-1">
                  <Clock className="h-3 w-3 text-purple-500" />
                  Time
                </Label>
                <Input
                  id={`time-${entry.id}`}
                  value={metadata.timeContext}
                  onChange={(e) => setMetadata({ ...metadata, timeContext: e.target.value })}
                  placeholder="e.g., childhood, 2010, age 15"
                  className="h-9 text-sm"
                />
              </div>

              {/* Place Context */}
              <div className="space-y-2">
                <Label htmlFor={`place-${entry.id}`} className="text-xs flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-blue-500" />
                  Place
                </Label>
                <Input
                  id={`place-${entry.id}`}
                  value={metadata.placeContext}
                  onChange={(e) => setMetadata({ ...metadata, placeContext: e.target.value })}
                  placeholder="e.g., New York, school"
                  className="h-9 text-sm"
                />
              </div>

              {/* Experience Type */}
              <div className="space-y-2">
                <Label htmlFor={`experience-${entry.id}`} className="text-xs flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-yellow-500" />
                  Experience
                </Label>
                <Input
                  id={`experience-${entry.id}`}
                  value={metadata.experienceType}
                  onChange={(e) => setMetadata({ ...metadata, experienceType: e.target.value })}
                  placeholder="e.g., learning, achievement"
                  className="h-9 text-sm"
                />
              </div>

              {/* Challenge Type */}
              <div className="space-y-2">
                <Label htmlFor={`challenge-${entry.id}`} className="text-xs flex items-center gap-1">
                  <Heart className="h-3 w-3 text-red-500" />
                  Challenge
                </Label>
                <Input
                  id={`challenge-${entry.id}`}
                  value={metadata.challengeType}
                  onChange={(e) => setMetadata({ ...metadata, challengeType: e.target.value })}
                  placeholder="e.g., bullying, loss"
                  className="h-9 text-sm"
                />
              </div>

              {/* Growth Theme */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor={`growth-${entry.id}`} className="text-xs flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  Growth
                </Label>
                <Input
                  id={`growth-${entry.id}`}
                  value={metadata.growthTheme}
                  onChange={(e) => setMetadata({ ...metadata, growthTheme: e.target.value })}
                  placeholder="e.g., resilience, patience"
                  className="h-9 text-sm"
                />
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

