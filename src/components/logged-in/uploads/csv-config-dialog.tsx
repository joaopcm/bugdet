"use client";

import { IconLoader2 } from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CsvQuestion } from "@/db/schema";
import { useInvalidateUploads } from "@/hooks/use-uploads";
import { trpc } from "@/lib/trpc/client";

interface CsvConfigDialogProps {
  uploadId: string;
  fileName: string;
  onSuccess?: () => void;
  children?: React.ReactNode;
  defaultOpen?: boolean;
}

export function CsvConfigDialog({
  uploadId,
  fileName,
  onSuccess,
  children,
  defaultOpen = false,
}: CsvConfigDialogProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const hasTriggeredAnalysis = useRef(false);
  const invalidate = useInvalidateUploads();

  const {
    mutate: analyzeCsv,
    data: analysisData,
    isPending: isAnalyzing,
    error: analysisError,
    reset: resetAnalysis,
  } = trpc.uploads.analyzeCsv.useMutation();

  const { mutate: submitAnswers, isPending: isSubmitting } =
    trpc.uploads.submitCsvAnswers.useMutation({
      onMutate: () => {
        toast.loading("Submitting answers...", { id: "csv-submit" });
      },
      onSuccess: () => {
        toast.success(
          "CSV processing started. We'll email you when it's done.",
          {
            id: "csv-submit",
          }
        );
        setOpen(false);
        setAnswers({});
        resetAnalysis();
        invalidate();
        onSuccess?.();
      },
      onError: (error) => {
        toast.error(error.message, { id: "csv-submit" });
      },
    });

  useEffect(() => {
    if (
      open &&
      !analysisData &&
      !isAnalyzing &&
      !hasTriggeredAnalysis.current
    ) {
      hasTriggeredAnalysis.current = true;
      analyzeCsv({ uploadId });
    }
  }, [open, uploadId, analysisData, isAnalyzing, analyzeCsv]);

  useEffect(() => {
    if (analysisData?.questions) {
      const initialAnswers: Record<string, string> = {};
      for (const question of analysisData.questions) {
        if (question.defaultValue) {
          initialAnswers[question.id] = question.defaultValue;
        } else if (question.type === "boolean") {
          initialAnswers[question.id] = "false";
        }
      }
      setAnswers(initialAnswers);
    }
  }, [analysisData?.questions]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const questions = analysisData?.questions ?? [];
    for (const question of questions) {
      if (question.required && !answers[question.id]?.trim()) {
        toast.error(`Please answer: ${question.label}`);
        return;
      }
    }

    submitAnswers({ uploadId, answers });
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setAnswers({});
      resetAnalysis();
      hasTriggeredAnalysis.current = false;
    }
  };

  const handleRetryAnalysis = () => {
    resetAnalysis();
    hasTriggeredAnalysis.current = false;
    analyzeCsv({ uploadId });
  };

  const renderQuestion = (question: CsvQuestion) => {
    const value = answers[question.id] ?? "";

    switch (question.type) {
      case "select":
        return (
          <Select
            onValueChange={(val) =>
              setAnswers((prev) => ({ ...prev, [question.id]: val }))
            }
            value={value}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {question.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "boolean":
        return (
          <div className="flex items-center gap-2">
            <Checkbox
              checked={value === "true"}
              id={question.id}
              onCheckedChange={(checked) =>
                setAnswers((prev) => ({
                  ...prev,
                  [question.id]: checked ? "true" : "false",
                }))
              }
            />
            <Label className="font-normal" htmlFor={question.id}>
              Yes
            </Label>
          </div>
        );

      default:
        return (
          <Input
            onChange={(e) =>
              setAnswers((prev) => ({ ...prev, [question.id]: e.target.value }))
            }
            placeholder={
              question.type === "date" ? "e.g., MM/DD/YYYY" : "Enter value"
            }
            value={value}
          />
        );
    }
  };

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Configure CSV import</DialogTitle>
            <DialogDescription>
              We need a bit more context about <strong>{fileName}</strong> to
              extract transactions accurately.
            </DialogDescription>
          </DialogHeader>

          {isAnalyzing && (
            <div className="flex items-center justify-center py-8">
              <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">
                Analyzing CSV...
              </span>
            </div>
          )}

          {analysisError && !isAnalyzing && (
            <div className="flex flex-col items-center justify-center gap-4 py-8">
              <p className="text-center text-destructive text-sm">
                Failed to analyze CSV. Please try again.
              </p>
              <Button
                onClick={handleRetryAnalysis}
                type="button"
                variant="outline"
              >
                Retry
              </Button>
            </div>
          )}

          {analysisData && !isAnalyzing && (
            <div className="grid gap-6 py-4">
              {analysisData.questions.length > 0 && (
                <div className="space-y-4">
                  <Label className="font-medium text-sm">
                    Please answer these questions
                  </Label>
                  {analysisData.questions.map((question) => (
                    <div className="grid gap-2" key={question.id}>
                      <Label htmlFor={question.id}>
                        {question.label}
                        {question.required && (
                          <span className="ml-1 text-red-500">*</span>
                        )}
                      </Label>
                      {question.description && (
                        <p className="text-muted-foreground text-xs">
                          {question.description}
                        </p>
                      )}
                      {renderQuestion(question)}
                    </div>
                  ))}
                </div>
              )}

              {analysisData.questions.length === 0 && (
                <p className="text-center text-muted-foreground">
                  Your CSV looks ready to process. Click Submit to start.
                </p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              onClick={() => handleOpenChange(false)}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              disabled={isAnalyzing || isSubmitting || !analysisData}
              type="submit"
            >
              Submit
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
