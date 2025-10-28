import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, Mail, Shield, Megaphone } from "lucide-react";

export function EarlyTesterNotice() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Show notice on every page load
    setOpen(true);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl max-h-[85vh] sm:max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-primary" />
            Welcome, Early Tester! 🎉
          </DialogTitle>
          <DialogDescription className="text-base">
            Thank you for being part of our testing community
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Appreciation Message */}
          <div className="bg-primary/10 p-4 rounded-lg">
            <p className="text-sm">
              We're grateful to have you as an early tester! Your feedback and patience 
              as we refine the Lifer App are invaluable. Thank you for joining us on this journey.
            </p>
          </div>

          {/* Feedback Section */}
          <div className="flex items-start gap-3 p-4 border rounded-lg">
            <Mail className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold mb-1">Have Feedback?</h3>
              <p className="text-sm text-muted-foreground mb-2">
                We'd love to hear from you! Please send any feedback, suggestions, or bug reports to:
              </p>
              <a 
                href="mailto:alan.nehemy@metamorphosisworldwide.com" 
                className="text-sm text-blue-600 hover:underline font-medium"
              >
                alan.nehemy@metamorphosisworldwide.com
              </a>
              <span className="text-sm text-muted-foreground"> or </span>
              <a 
                href="mailto:info@metamorphosisworldwide.com" 
                className="text-sm text-blue-600 hover:underline font-medium"
              >
                info@metamorphosisworldwide.com
              </a>
            </div>
          </div>

          {/* Feature Status */}
          <div className="flex items-start gap-3 p-4 border rounded-lg">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold mb-2">Feature Status</h3>
              <div className="text-sm space-y-2">
                <div>
                  <strong className="text-foreground">✅ Chat (Mr. MG):</strong>
                  <span className="text-muted-foreground"> Stable (with bugs) - AI mentor available. </span>
                  <span className="text-blue-600 font-medium">Beta: Ask Mr. MG to navigate the app!</span>
                </div>
                <div>
                  <strong className="text-foreground">⚠️ Life Story (Journal):</strong>
                  <span className="text-muted-foreground"> Partially Stable - Text input works well. Card management, combining entries, and timeline display under development.</span>
                </div>
                <div>
                  <strong className="text-foreground">⚠️ Patterns:</strong>
                  <span className="text-muted-foreground"> Beta - Detection working, AI analysis may need refinement. Report anything that seems off.</span>
                </div>
                <div>
                  <strong className="text-foreground">✅ Vision Board:</strong>
                  <span className="text-muted-foreground"> Stable - All features functional (create, manage, image uploads, goal tracking).</span>
                </div>
                <div>
                  <strong className="text-foreground">⚠️ Meditation:</strong>
                  <span className="text-muted-foreground"> Experimental - Voice guidance works but TTS providers being tested. Voices will change without notice.</span>
                </div>
                <div>
                  <strong className="text-foreground">🚧 Primary Aim:</strong>
                  <span className="text-muted-foreground"> In Development - Basic functionality available, being refined and expanded.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Privacy & Data Notice */}
          <div className="flex items-start gap-3 p-4 border rounded-lg bg-amber-50 dark:bg-amber-950/20">
            <Shield className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold mb-1">Privacy & Data Notice</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>✓ We are <strong>not monitoring</strong> your personal data</li>
                <li>⚠️ We are <strong>not responsible</strong> for data loss during testing</li>
                <li>💾 Please <strong>backup your data</strong> regularly (available in Settings)</li>
              </ul>
            </div>
          </div>

          {/* Release Notes Promise */}
          <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
            <p className="text-sm">
              <strong>Stay Updated:</strong> We'll keep you informed with regular release notes 
              about new features, improvements, and changes.
            </p>
          </div>
        </div>

        <div className="sticky bottom-0 bg-background pt-4 pb-2 flex justify-end border-t mt-4">
          <Button onClick={() => setOpen(false)} className="w-full sm:w-auto">
            Got it, thanks!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

