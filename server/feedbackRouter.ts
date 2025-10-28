import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";

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

      // TODO: Implement actual email sending
      // For now, just log it
      console.log("[Feedback] New feedback received:");
      console.log(emailBody);
      
      // In production, you would use a service like:
      // - SendGrid
      // - AWS SES
      // - Resend
      // - Nodemailer with SMTP
      
      // Example with a hypothetical email service:
      // await sendEmail({
      //   to: "support@metamorphosisworldwide.com",
      //   subject: `Lifer App Feedback: ${input.area || "General"} - ${input.state || "Feedback"}`,
      //   text: emailBody,
      // });
      
      return { success: true };
    }),
});

