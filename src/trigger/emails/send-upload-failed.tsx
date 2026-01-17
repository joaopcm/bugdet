import { logger, task } from "@trigger.dev/sdk/v3";
import UploadFailedEmail from "@/components/emails/templates/upload-failed";
import { resend } from "@/lib/resend";

export const sendUploadFailedTask = task({
  id: "send-upload-failed",
  run: async (
    payload: { to: string; fileName: string; uploadsLink: string },
    { ctx }
  ) => {
    logger.info(`Sending upload failed email to ${payload.to}...`, {
      payload,
      ctx,
    });
    const email = await resend.sendEmail({
      to: payload.to,
      subject: "Your bank statement could not be processed",
      react: (
        <UploadFailedEmail
          fileName={payload.fileName}
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
