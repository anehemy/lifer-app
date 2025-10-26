import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Edit2, Save, X, Clock, MapPin, Sparkles, Heart, TrendingUp } from "lucide-react";
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

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-2">
              {new Date(entry.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
            <p className="font-medium text-purple-600 dark:text-purple-400 mb-2">
              {entry.question}
            </p>
            {isEditing ? (
              <textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                className="w-full p-3 border rounded-md text-base min-h-[100px] mb-4"
                placeholder="Enter your response..."
              />
            ) : (
              <p className="text-base whitespace-pre-wrap mb-4">{entry.response}</p>
            )}

            {/* Metadata Section */}
            <div className="border-t pt-4 mt-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-muted-foreground">Context & Themes</h4>
                {!isEditing ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit2 className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                ) : (
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
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Time Context */}
                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-purple-500 mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <div>
                        <Label htmlFor={`time-${entry.id}`} className="text-xs">Time</Label>
                        <Input
                          id={`time-${entry.id}`}
                          value={metadata.timeContext}
                          onChange={(e) => setMetadata({ ...metadata, timeContext: e.target.value })}
                          placeholder="e.g., childhood, 2010, age 15"
                          className="h-8 text-sm"
                        />
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs text-muted-foreground">Time</p>
                        <p className="text-sm">{entry.timeContext || "Not specified"}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Place Context */}
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-blue-500 mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <div>
                        <Label htmlFor={`place-${entry.id}`} className="text-xs">Place</Label>
                        <Input
                          id={`place-${entry.id}`}
                          value={metadata.placeContext}
                          onChange={(e) => setMetadata({ ...metadata, placeContext: e.target.value })}
                          placeholder="e.g., New York, school"
                          className="h-8 text-sm"
                        />
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs text-muted-foreground">Place</p>
                        <p className="text-sm">{entry.placeContext || "Not specified"}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Experience Type */}
                <div className="flex items-start gap-2">
                  <Sparkles className="h-4 w-4 text-yellow-500 mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <div>
                        <Label htmlFor={`experience-${entry.id}`} className="text-xs">Experience</Label>
                        <Input
                          id={`experience-${entry.id}`}
                          value={metadata.experienceType}
                          onChange={(e) => setMetadata({ ...metadata, experienceType: e.target.value })}
                          placeholder="e.g., learning, achievement"
                          className="h-8 text-sm"
                        />
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs text-muted-foreground">Experience</p>
                        <p className="text-sm">{entry.experienceType || "Not specified"}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Challenge Type */}
                <div className="flex items-start gap-2">
                  <Heart className="h-4 w-4 text-red-500 mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <div>
                        <Label htmlFor={`challenge-${entry.id}`} className="text-xs">Challenge</Label>
                        <Input
                          id={`challenge-${entry.id}`}
                          value={metadata.challengeType}
                          onChange={(e) => setMetadata({ ...metadata, challengeType: e.target.value })}
                          placeholder="e.g., bullying, loss"
                          className="h-8 text-sm"
                        />
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs text-muted-foreground">Challenge</p>
                        <p className="text-sm">{entry.challengeType || "Not specified"}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Growth Theme */}
                <div className="flex items-start gap-2 md:col-span-2">
                  <TrendingUp className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <div>
                        <Label htmlFor={`growth-${entry.id}`} className="text-xs">Growth</Label>
                        <Input
                          id={`growth-${entry.id}`}
                          value={metadata.growthTheme}
                          onChange={(e) => setMetadata({ ...metadata, growthTheme: e.target.value })}
                          placeholder="e.g., resilience, patience"
                          className="h-8 text-sm"
                        />
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs text-muted-foreground">Growth</p>
                        <p className="text-sm">{entry.growthTheme || "Not specified"}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
    </Card>
  );
}

