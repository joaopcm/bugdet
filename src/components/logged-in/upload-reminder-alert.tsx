"use client";

import { IconFileUpload } from "@tabler/icons-react";
import { useEffect, useMemo, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { trpc } from "@/lib/trpc/client";

const REMINDER_MESSAGES = [
  {
    title: "Time flies!",
    message:
      "It's been a while since you uploaded your latest bank statement. What about uploading a new one to get more insights?",
  },
  {
    title: "Stay on top of your finances",
    message:
      "You haven't uploaded a bank statement recently. Keep your data fresh for better financial insights!",
  },
  {
    title: "Missing something?",
    message:
      "Your financial data might be outdated. Upload a new bank statement to see the full picture.",
  },
  {
    title: "Keep it fresh",
    message:
      "Your last upload was a while ago. Upload a new statement to keep your financial overview up to date.",
  },
  {
    title: "New month, new insights",
    message:
      "Time to update your records! Upload your latest bank statement to track your recent spending.",
  },
  {
    title: "Your wallet misses you",
    message:
      "It's been some time since your last upload. Get the latest insights by uploading a new statement.",
  },
  {
    title: "Catch up on your finances",
    message:
      "Don't let your financial tracking fall behind. Upload a fresh bank statement today!",
  },
  {
    title: "Ready for an update?",
    message:
      "Your financial data could use a refresh. Upload a new bank statement to stay informed.",
  },
  {
    title: "More data, better insights",
    message:
      "The more statements you upload, the smarter your insights become. Add a new one!",
  },
  {
    title: "Keep the momentum going",
    message:
      "You've been doing great! Don't stop now - upload your latest statement for continued tracking.",
  },
  {
    title: "Data getting stale?",
    message:
      "Your financial snapshot might be outdated. Refresh it with a new bank statement upload.",
  },
  {
    title: "Quick update needed",
    message:
      "A new bank statement would help keep your financial overview accurate and current.",
  },
  {
    title: "Insights await",
    message:
      "There could be new spending patterns to discover. Upload a recent statement to find out!",
  },
  {
    title: "Time for a check-in",
    message:
      "Regular uploads help you stay in control. Add your latest bank statement now.",
  },
  {
    title: "Stay informed",
    message:
      "Knowledge is power! Upload a new bank statement to keep your financial knowledge current.",
  },
];

const DAYS_THRESHOLD = 7;

interface UploadReminderAlertProps {
  onUploadClick: () => void;
}

export function UploadReminderAlert({
  onUploadClick,
}: UploadReminderAlertProps) {
  const { data, isLoading } = trpc.uploads.getLatestUploadDate.useQuery();

  const shouldShowReminder = useMemo(() => {
    if (isLoading || !data) {
      return false;
    }

    // Show reminder if user has never uploaded
    if (!data.latestUploadDate) {
      return true;
    }

    const latestUploadDate = new Date(data.latestUploadDate);
    const now = new Date();
    const diffTime = now.getTime() - latestUploadDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    return diffDays >= DAYS_THRESHOLD;
  }, [data, isLoading]);

  const [randomMessage, setRandomMessage] = useState<
    (typeof REMINDER_MESSAGES)[number] | null
  >(null);

  useEffect(() => {
    setRandomMessage(
      REMINDER_MESSAGES[Math.floor(Math.random() * REMINDER_MESSAGES.length)]
    );
  }, []);

  if (!(shouldShowReminder && randomMessage)) {
    return null;
  }

  return (
    <Alert
      className="cursor-pointer transition-colors hover:bg-accent"
      onClick={onUploadClick}
    >
      <IconFileUpload className="size-4" />
      <AlertTitle>{randomMessage.title}</AlertTitle>
      <AlertDescription>{randomMessage.message}</AlertDescription>
    </Alert>
  );
}
