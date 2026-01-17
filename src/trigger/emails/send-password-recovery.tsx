import { logger, task } from "@trigger.dev/sdk/v3";
import ForgotPasswordEmail from "@/components/emails/templates/forgot-password";
import { resend } from "@/lib/resend";

export const sendPasswordRecoveryTask = task({
  id: "send-password-recovery",
  run: async (payload: { to: string; url: string }, { ctx }) => {
    logger.info(`Sending password recovery email to ${payload.to}...`, {
      payload,
      ctx,
    });
    const email = await resend.sendEmail({
      to: payload.to,
      subject: "Reset your password",
      react: <ForgotPasswordEmail resetPasswordLink={payload.url} />,
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
