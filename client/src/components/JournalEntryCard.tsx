import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Edit2, Save, X, Clock, MapPin, Sparkles, Heart, TrendingUp, ChevronDown, ChevronUp, MessageCircle, AlertCircle, CheckCircle2, Bell } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { calculateCompleteness, getMissingFieldLabel, getCompletenessColor, getCompletenessBgColor } from "@shared/completeness";

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

  const updateResponse = trpc.journal.updateResponse.useMutation({
    onSuccess: () => {
      utils.journal.list.invalidate();
      toast.success("Response updated");
      setIsEditing(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update response");
    },
  });

  const handleSave = () => {
    // Save both metadata and response
    updateMetadata.mutate({
      id: entry.id,
      ...metadata,
    });
    
    if (responseText !== entry.response) {
      updateResponse.mutate({
        id: entry.id,
        response: responseText,
      });
    }
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

  // Truncate long responses
  const MAX_LENGTH = 300;
  const isLongResponse = entry.response.length > MAX_LENGTH;
  const displayResponse = isExpanded || isEditing ? entry.response : 
    isLongResponse ? entry.response.slice(0, MAX_LENGTH) + "..." : entry.response;

  // Helper function to check if a value exists
  const hasValue = (val: string | null | undefined) => {
    return val && val.trim() !== '' && val !== 'null';
  };

  return (
    <div className="group relative border-l-4 border-red-600 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all p-6 mb-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
              <time dateTime={entry.createdAt.toISOString()}>
                {new Date(entry.createdAt).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </time>
            </div>

            {/* Completeness indicator */}
            {(() => {
              const completeness = calculateCompleteness({
                timeContext: entry.timeContext,
                placeContext: entry.placeContext,
                experienceType: entry.experienceType,
                challengeType: entry.challengeType,
                growthTheme: entry.growthTheme,
              });
              return (
                <div className="flex items-center gap-2">
                  {completeness.percentage === 100 ? (
                    <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span className="text-xs font-medium">Complete</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <AlertCircle className={`h-3.5 w-3.5 ${getCompletenessColor(completeness.percentage)}`} />
                        <span className={`text-xs font-medium ${getCompletenessColor(completeness.percentage)}`}>
                          {completeness.percentage}%
                        </span>
                      </div>
                      <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all ${completeness.percentage === 100 ? 'bg-green-500' : completeness.percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${completeness.percentage}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
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

          {/* Missing data indicators */}
          {!isEditing && (() => {
            const completeness = calculateCompleteness({
              timeContext: entry.timeContext,
              placeContext: entry.placeContext,
              experienceType: entry.experienceType,
              challengeType: entry.challengeType,
              growthTheme: entry.growthTheme,
            });
            return completeness.missingFields.length > 0 && (
              <div className="mb-3 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <p className="text-xs text-amber-700 dark:text-amber-300 font-medium mb-1">Missing information:</p>
                <div className="flex flex-wrap gap-1">
                  {completeness.missingFields.map(field => (
                    <span key={field} className="text-xs text-amber-600 dark:text-amber-400">
                      {getMissingFieldLabel(field)}
                    </span>
                  )).reduce((prev, curr) => [prev, <span key="sep" className="text-amber-400">, </span>, curr] as any)}
                </div>
                <a href="/notifications">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 h-7 text-xs text-amber-700 hover:text-amber-800 hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-900/40"
                  >
                    <Bell className="h-3 w-3 mr-1" />
                    Complete this entry
                  </Button>
                </a>
              </div>
            );
          })()}
          
          {/* Quick context tags - ALWAYS show all 5 fields */}
          {!isEditing && (
            <div className="flex flex-wrap gap-2 mb-4">
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                hasValue(entry.timeContext)
                  ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 italic'
              }`}>
                <Clock className="h-3 w-3" />
                {hasValue(entry.timeContext) ? entry.timeContext : 'Add time'}
              </span>
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                hasValue(entry.placeContext)
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 italic'
              }`}>
                <MapPin className="h-3 w-3" />
                {hasValue(entry.placeContext) ? entry.placeContext : 'Add place'}
              </span>
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                hasValue(entry.experienceType)
                  ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 italic'
              }`}>
                <Sparkles className="h-3 w-3" />
                {hasValue(entry.experienceType) ? entry.experienceType : 'Add experience'}
              </span>
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                hasValue(entry.challengeType)
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 italic'
              }`}>
                <Heart className="h-3 w-3" />
                {hasValue(entry.challengeType) ? entry.challengeType : 'Add challenge'}
              </span>
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                hasValue(entry.growthTheme)
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 italic'
              }`}>
                <TrendingUp className="h-3 w-3" />
                {hasValue(entry.growthTheme) ? entry.growthTheme : 'Add growth'}
              </span>
            </div>
          )}

          {/* Editing form for metadata */}
          {isEditing && (
            <div className="space-y-4 mb-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`time-${entry.id}`} className="text-xs flex items-center gap-1">
                    <Clock className="h-3 w-3 text-purple-500" />
                    Time Context
                  </Label>
                  <Input
                    id={`time-${entry.id}`}
                    value={metadata.timeContext}
                    onChange={(e) => setMetadata({ ...metadata, timeContext: e.target.value })}
                    placeholder="e.g., childhood, college years, 2020"
                    className="text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`place-${entry.id}`} className="text-xs flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-blue-500" />
                    Place
                  </Label>
                  <Input
                    id={`place-${entry.id}`}
                    value={metadata.placeContext}
                    onChange={(e) => setMetadata({ ...metadata, placeContext: e.target.value })}
                    placeholder="e.g., New York, home, workplace"
                    className="text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`experience-${entry.id}`} className="text-xs flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-yellow-500" />
                    Experience Type
                  </Label>
                  <Input
                    id={`experience-${entry.id}`}
                    value={metadata.experienceType}
                    onChange={(e) => setMetadata({ ...metadata, experienceType: e.target.value })}
                    placeholder="e.g., career, relationship, travel"
                    className="text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`challenge-${entry.id}`} className="text-xs flex items-center gap-1">
                    <Heart className="h-3 w-3 text-red-500" />
                    Challenge
                  </Label>
                  <Input
                    id={`challenge-${entry.id}`}
                    value={metadata.challengeType}
                    onChange={(e) => setMetadata({ ...metadata, challengeType: e.target.value })}
                    placeholder="e.g., loss, conflict, fear"
                    className="text-sm"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor={`growth-${entry.id}`} className="text-xs flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-green-500" />
                    Growth Theme
                  </Label>
                  <Input
                    id={`growth-${entry.id}`}
                    value={metadata.growthTheme}
                    onChange={(e) => setMetadata({ ...metadata, growthTheme: e.target.value })}
                    placeholder="e.g., resilience, self-discovery, independence"
                    className="text-sm"
                  />
                </div>
              </div>
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

      {/* Save/Cancel buttons when editing */}
      {isEditing && (
        <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancel}
            disabled={updateMetadata.isPending || updateResponse.isPending}
          >
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={updateMetadata.isPending || updateResponse.isPending}
          >
            <Save className="h-4 w-4 mr-1" />
            {updateMetadata.isPending || updateResponse.isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      )}
    </div>
  );
}

