"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import type { CsvQuestion } from "@/db/schema";
import { useInvalidateUploads } from "@/hooks/use-uploads";
import { trpc } from "@/lib/trpc/client";

function buildSchema(questions: CsvQuestion[]) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const question of questions) {
    let fieldSchema = z.string();
    if (question.required) {
      fieldSchema = fieldSchema.min(1, "This answer is required");
    }
    shape[question.id] = fieldSchema;
  }
  return z.object(shape);
}

function getDefaultValues(questions: CsvQuestion[]) {
  const defaults: Record<string, string> = {};
  for (const question of questions) {
    if (question.defaultValue) {
      defaults[question.id] = question.defaultValue;
    } else if (question.type === "boolean") {
      defaults[question.id] = "false";
    } else {
      defaults[question.id] = "";
    }
  }
  return defaults;
}

function QuestionsSkeleton() {
  return (
    <div className="grid gap-6 py-4">
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div className="grid gap-2" key={String(index)}>
            <Skeleton className="h-3 w-48" />
            <Skeleton className="h-2 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

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
        form.reset({});
        resetAnalysis();
        invalidate();
        onSuccess?.();
      },
      onError: (error) => {
        toast.error(error.message, { id: "csv-submit" });
      },
    });

  const questions = analysisData?.questions ?? [];
  const schema = useMemo(() => buildSchema(questions), [questions]);

  const form = useForm<Record<string, string>>({
    resolver: zodResolver(schema),
    defaultValues: getDefaultValues(questions),
  });

  useEffect(() => {
    if (open && !analysisData && !isAnalyzing) {
      analyzeCsv({ uploadId });
    }
  }, [open, uploadId, analysisData, isAnalyzing, analyzeCsv]);

  useEffect(() => {
    if (analysisData?.questions) {
      if (analysisData.questions.length === 0) {
        submitAnswers({ uploadId, answers: {} });
      } else {
        form.reset(getDefaultValues(analysisData.questions));
      }
    }
  }, [analysisData?.questions, uploadId, submitAnswers, form]);

  const handleSubmit = (answers: Record<string, string>) => {
    submitAnswers({ uploadId, answers });
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      form.reset({});
      resetAnalysis();
    }
  };

  const handleRetryAnalysis = () => {
    resetAnalysis();
    analyzeCsv({ uploadId });
  };

  const renderQuestionControl = (
    question: CsvQuestion,
    field: {
      value: string;
      onChange: (value: string) => void;
    }
  ) => {
    switch (question.type) {
      case "select":
        return (
          <Select onValueChange={field.onChange} value={field.value}>
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
              checked={field.value === "true"}
              id={question.id}
              onCheckedChange={(checked) =>
                field.onChange(checked ? "true" : "false")
              }
            />
            <label className="font-normal text-sm" htmlFor={question.id}>
              Yes
            </label>
          </div>
        );

      default:
        return (
          <Input
            onChange={(e) => field.onChange(e.target.value)}
            placeholder={
              question.type === "date" ? "e.g., MM/DD/YYYY" : "Enter value"
            }
            value={field.value}
          />
        );
    }
  };

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <DialogHeader>
              <DialogTitle>Configure CSV import</DialogTitle>
              <DialogDescription>
                We need a bit more context about <strong>{fileName}</strong> to
                extract transactions accurately.
              </DialogDescription>
            </DialogHeader>

            {isAnalyzing && <QuestionsSkeleton />}

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
                {questions.length > 0 && (
                  <div className="space-y-4">
                    {questions.map((question) => (
                      <FormField
                        control={form.control}
                        key={question.id}
                        name={question.id}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{question.label}</FormLabel>
                            {question.description && (
                              <p className="text-muted-foreground text-xs">
                                {question.description}
                              </p>
                            )}
                            <FormControl>
                              {renderQuestionControl(question, {
                                value: field.value ?? "",
                                onChange: field.onChange,
                              })}
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
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
        </Form>
      </DialogContent>
    </Dialog>
  );
}
