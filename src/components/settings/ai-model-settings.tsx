"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AI_TASK_SLOTS, type AITaskSlot } from "@/constants/ai-models";
import { trpc } from "@/lib/trpc/client";

const DEFAULT_SENTINEL = "__default__";

const formSchema = z.object({
  statementExtractionModel: z.string(),
  documentAnalysisModel: z.string(),
  categorizationModel: z.string(),
});

type FormValues = z.infer<typeof formSchema>;

const SLOT_TO_FIELD: Record<AITaskSlot, keyof FormValues> = {
  statementExtraction: "statementExtractionModel",
  documentAnalysis: "documentAnalysisModel",
  categorization: "categorizationModel",
};

export function AIModelSettings() {
  const utils = trpc.useUtils();
  const visionModelsQuery = trpc.aiModels.list.useQuery({
    requiresVision: true,
  });
  const allModelsQuery = trpc.aiModels.list.useQuery({});
  const preferencesQuery = trpc.aiPreferences.get.useQuery();

  const updatePreferences = trpc.aiPreferences.update.useMutation({
    onSuccess: () => {
      toast.success("AI model preferences saved");
      utils.aiPreferences.get.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      statementExtractionModel: DEFAULT_SENTINEL,
      documentAnalysisModel: DEFAULT_SENTINEL,
      categorizationModel: DEFAULT_SENTINEL,
    },
  });

  useEffect(() => {
    if (!preferencesQuery.data) {
      return;
    }
    form.reset({
      statementExtractionModel:
        preferencesQuery.data.statementExtractionModel ?? DEFAULT_SENTINEL,
      documentAnalysisModel:
        preferencesQuery.data.documentAnalysisModel ?? DEFAULT_SENTINEL,
      categorizationModel:
        preferencesQuery.data.categorizationModel ?? DEFAULT_SENTINEL,
    });
  }, [preferencesQuery.data, form]);

  const groupedVisionModels = useMemo(
    () => groupByProvider(visionModelsQuery.data ?? []),
    [visionModelsQuery.data]
  );
  const groupedAllModels = useMemo(
    () => groupByProvider(allModelsQuery.data ?? []),
    [allModelsQuery.data]
  );

  function onSubmit(values: FormValues) {
    updatePreferences.mutate({
      statementExtractionModel:
        values.statementExtractionModel === DEFAULT_SENTINEL
          ? null
          : values.statementExtractionModel,
      documentAnalysisModel:
        values.documentAnalysisModel === DEFAULT_SENTINEL
          ? null
          : values.documentAnalysisModel,
      categorizationModel:
        values.categorizationModel === DEFAULT_SENTINEL
          ? null
          : values.categorizationModel,
    });
  }

  const isLoading =
    preferencesQuery.isPending ||
    visionModelsQuery.isPending ||
    allModelsQuery.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Models</CardTitle>
        <CardDescription>
          Choose which model powers each of Bugdet's AI features. Leave a slot
          on "Use default" to keep the recommended model.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            className="flex flex-col gap-6"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            {(Object.keys(AI_TASK_SLOTS) as AITaskSlot[]).map((slot) => {
              const config = AI_TASK_SLOTS[slot];
              const groups = config.requiresVision
                ? groupedVisionModels
                : groupedAllModels;

              return (
                <FormField
                  control={form.control}
                  key={slot}
                  name={SLOT_TO_FIELD[slot]}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium text-base">
                        {config.label}
                      </FormLabel>
                      <FormControl>
                        <Select
                          disabled={isLoading}
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a model..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={DEFAULT_SENTINEL}>
                              Use default
                            </SelectItem>
                            {groups.length > 0 && <SelectSeparator />}
                            {groups.map((group) => (
                              <SelectGroup key={group.provider}>
                                <SelectLabel>{group.provider}</SelectLabel>
                                {group.models.map((model) => (
                                  <SelectItem
                                    key={model.modelId}
                                    value={model.modelId}
                                  >
                                    {model.name}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormDescription>
                        {config.description} Recommended:{" "}
                        <code className="rounded bg-muted px-1 py-0.5 text-xs">
                          {config.defaultModel}
                        </code>
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              );
            })}

            <div className="flex justify-end">
              <Button
                disabled={updatePreferences.isPending || isLoading}
                type="submit"
              >
                {updatePreferences.isPending ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

interface ModelRow {
  modelId: string;
  provider: string;
  name: string;
}

interface ProviderGroup {
  provider: string;
  models: ModelRow[];
}

function groupByProvider(models: ModelRow[]): ProviderGroup[] {
  const groups = new Map<string, ModelRow[]>();
  for (const model of models) {
    const list = groups.get(model.provider) ?? [];
    list.push(model);
    groups.set(model.provider, list);
  }
  return Array.from(groups.entries()).map(([provider, models]) => ({
    provider,
    models,
  }));
}
