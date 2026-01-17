import { logger, task } from "@trigger.dev/sdk/v3";
import WrongPasswordEmail from "@/components/emails/templates/wrong-password";
import { resend } from "@/lib/resend";

export const sendWrongPasswordTask = task({
  id: "send-wrong-password",
  run: async (
    payload: { to: string; fileName: string; uploadsLink: string },
    { ctx }
  ) => {
    logger.info(`Sending wrong password email to ${payload.to}...`, {
      payload,
      ctx,
    });
    const email = await resend.sendEmail({
      to: payload.to,
      subject: "Incorrect password for your bank statement",
      react: (
        <WrongPasswordEmail
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
