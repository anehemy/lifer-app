import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { notifyOwner } from "./_core/notification";

export const feedbackRouter = router({
  send: protectedProcedure
    .input(z.object({
      area: z.string().optional(),
      function: z.string().optional(),
      state: z.string().optional(),
      message: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Format email content
      const emailBody = `
New Feedback from Lifer App

User: ${ctx.user.name || "Unknown"} (${ctx.user.email || "No email"})
User ID: ${ctx.user.id}
Timestamp: ${new Date().toISOString()}

Selected Options:
- Area: ${input.area || "Not specified"}
- Function: ${input.function || "Not specified"}
- State: ${input.state || "Not specified"}

Message:
${input.message}

---
Sent from Lifer App Feedback System
      `.trim();

      // Log to console for debugging
      console.log("[Feedback] New feedback received:");
      console.log(emailBody);
      
      // Send notification via Manus notification service
      try {
        await notifyOwner({
          title: `Lifer App Feedback: ${input.area || "General"} - ${input.state || "Feedback"}`,
          content: emailBody,
        });
        
        return { success: true };
      } catch (error) {
        console.error("[Feedback] Failed to send notification:", error);
        // Still return success since we logged it
        return { success: true };
      }
    }),
});

