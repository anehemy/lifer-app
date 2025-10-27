import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AMBIENT_SOUNDS } from "@shared/ambientSounds";

interface UserContext {
  firstName: string;
  recentJournalEntries: Array<{ question: string; response: string }>;
  visionItems: Array<{ title: string; description: string }>;
  primaryAimStatement: string | null;
  patterns: string[];
}

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (selectedContext: any) => void;
  userContext: UserContext;
  meditationType: string;
  isGenerating?: boolean;
}

export default function MeditationCustomizer({ open, onClose, onConfirm, userContext, meditationType, isGenerating = false }: Props) {
  const [includeFirstName, setIncludeFirstName] = useState(true);
  const [selectedJournalEntries, setSelectedJournalEntries] = useState<number[]>([]);
  const [selectedVisionItems, setSelectedVisionItems] = useState<number[]>([]);
  const [includePrimaryAim, setIncludePrimaryAim] = useState(!!userContext.primaryAimStatement);
  const [selectedPatterns, setSelectedPatterns] = useState<number[]>([]);
  const [ambientSound, setAmbientSound] = useState<string>("ocean");

  const handleConfirm = () => {
    const context = {
      firstName: includeFirstName ? userContext.firstName : null,
      journalEntries: selectedJournalEntries.map(i => userContext.recentJournalEntries[i]),
      visionItems: selectedVisionItems.map(i => userContext.visionItems[i]),
      primaryAim: includePrimaryAim ? userContext.primaryAimStatement : null,
      patterns: selectedPatterns.map(i => userContext.patterns[i]),
      ambientSound,
    };
    onConfirm(context);
  };

  const toggleJournalEntry = (index: number) => {
    setSelectedJournalEntries(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const toggleVisionItem = (index: number) => {
    setSelectedVisionItems(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const togglePattern = (index: number) => {
    setSelectedPatterns(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Customize Your {meditationType} Meditation</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <p className="text-sm text-muted-foreground">
            Select the personal elements you'd like to include in your meditation for a more personalized experience.
          </p>

          {/* First Name */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="firstName"
              checked={includeFirstName}
              onCheckedChange={(checked) => setIncludeFirstName(!!checked)}
            />
            <Label htmlFor="firstName" className="cursor-pointer">
              Include my first name ({userContext.firstName})
            </Label>
          </div>

          {/* Journal Entries */}
          {userContext.recentJournalEntries.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Recent Journal Reflections</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {userContext.recentJournalEntries.map((entry, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <Checkbox
                      id={`journal-${index}`}
                      checked={selectedJournalEntries.includes(index)}
                      onCheckedChange={() => toggleJournalEntry(index)}
                    />
                    <Label htmlFor={`journal-${index}`} className="cursor-pointer text-sm">
                      <span className="font-medium">{entry.question}</span>
                      <p className="text-muted-foreground line-clamp-2">{entry.response}</p>
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Vision Items */}
          {userContext.visionItems.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Vision Board Items</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {userContext.visionItems.map((item, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <Checkbox
                      id={`vision-${index}`}
                      checked={selectedVisionItems.includes(index)}
                      onCheckedChange={() => toggleVisionItem(index)}
                    />
                    <Label htmlFor={`vision-${index}`} className="cursor-pointer text-sm">
                      <span className="font-medium">{item.title}</span>
                      {item.description && (
                        <p className="text-muted-foreground line-clamp-1">{item.description}</p>
                      )}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Primary Aim */}
          {userContext.primaryAimStatement && (
            <div className="flex items-start space-x-2">
              <Checkbox
                id="primaryAim"
                checked={includePrimaryAim}
                onCheckedChange={(checked) => setIncludePrimaryAim(!!checked)}
              />
              <Label htmlFor="primaryAim" className="cursor-pointer">
                <span className="font-medium">Include my Primary Aim</span>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {userContext.primaryAimStatement}
                </p>
              </Label>
            </div>
          )}

          {/* Patterns */}
          {userContext.patterns.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Identified Patterns</h3>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {userContext.patterns.map((pattern, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <Checkbox
                      id={`pattern-${index}`}
                      checked={selectedPatterns.includes(index)}
                      onCheckedChange={() => togglePattern(index)}
                    />
                    <Label htmlFor={`pattern-${index}`} className="cursor-pointer text-sm">
                      {pattern}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Ambient Sound Selection */}
          <div>
            <h3 className="font-semibold mb-2">Background Ambience</h3>
            <Select value={ambientSound} onValueChange={setAmbientSound}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(AMBIENT_SOUNDS).map(([key, sound]) => (
                  <SelectItem key={key} value={key}>
                    {sound.name} - {sound.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isGenerating}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Generating...
              </>
            ) : (
              "Generate Meditation"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
