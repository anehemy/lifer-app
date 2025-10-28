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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
              <h3 className="font-semibold mb-1">Current Status</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>
                  <strong>Chat (Mr. MG):</strong> Stable and available, though you may encounter occasional bugs
                </li>
                <li>
                  <strong>Voice/TTS:</strong> Experimental - voices will change without notice as we test different providers
                </li>
              </ul>
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

        <div className="flex justify-end">
          <Button onClick={() => setOpen(false)}>
            Got it, thanks!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

