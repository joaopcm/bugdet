import { logger, task } from "@trigger.dev/sdk/v3";
import UploadCompletedEmail from "@/components/emails/templates/upload-completed";
import { resend } from "@/lib/resend";

export const sendUploadCompletedTask = task({
  id: "send-upload-completed",
  run: async (
    payload: {
      to: string;
      fileName: string;
      transactionCount: number;
      categoriesCreated: number;
      rulesApplied: number;
      lowConfidenceCount: number;
      uploadsLink: string;
    },
    { ctx }
  ) => {
    logger.info(`Sending upload completed email to ${payload.to}...`, {
      payload,
      ctx,
    });
    const email = await resend.sendEmail({
      to: payload.to,
      subject: "Your bank statement has been processed",
      react: (
        <UploadCompletedEmail
          categoriesCreated={payload.categoriesCreated}
          fileName={payload.fileName}
          lowConfidenceCount={payload.lowConfidenceCount}
          rulesApplied={payload.rulesApplied}
          transactionCount={payload.transactionCount}
          uploadsLink={payload.uploadsLink}
        />
      ),
    });
    logger.info(`Email sent to ${payload.to}`, { email });

    return { success: true };
  },
  catchError: ({ ctx, error, payload }) => {
    logger.error(`Run ${ctx.run.id} failed`, {
      payload,
      error,
    });
  },
});
