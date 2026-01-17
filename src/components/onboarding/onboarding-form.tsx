"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useHotkeys } from "react-hotkeys-hook";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { INDUSTRIES, PRIMARY_USES, WORK_TYPES } from "@/constants/onboarding";
import { trpc } from "@/lib/trpc/client";
import { sleep } from "@/lib/utils";
import { DialogClose, DialogFooter } from "../ui/dialog";
import { Kbd, SHORTCUTS_VALUES } from "../ui/kbd";
import { IndustrySelect } from "./industry-select";

const industryValues = INDUSTRIES.map((i) => i.value) as [string, ...string[]];

const onboardingSchema = z.object({
  workType: z
    .enum([
      "employed",
      "self_employed",
      "business_owner",
      "student",
      "retired",
      "unemployed",
    ])
    .nullable(),
  primaryUse: z.enum(["personal", "business", "both"]).nullable(),
  industry: z.enum(industryValues).nullable(),
});

type OnboardingFormValues = z.infer<typeof onboardingSchema>;

const TOAST_ID = "onboarding";

export function OnboardingForm() {
  const router = useRouter();

  const completeOnboarding = trpc.onboarding.complete.useMutation({
    onSuccess: async () => {
      await sleep(3000 + Math.random() * 2000);
      toast.success("Custom categories created for you!", {
        id: TOAST_ID,
        description:
          "We've just customized your account setup to your needs. You can always change it later.",
      });
      router.refresh();
    },
    onError: (error) => {
      toast.error(error.message, { id: TOAST_ID });
    },
  });

  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      workType: null,
      primaryUse: null,
      industry: null,
    },
  });

  function onSubmit(values: OnboardingFormValues) {
    toast.loading("Tailoring Bugdet for you...", { id: TOAST_ID });
    completeOnboarding.mutate(values);
  }

  function handleSkip() {
    toast.loading("Tailoring Bugdet for you...", { id: TOAST_ID });
    completeOnboarding.mutate({
      workType: null,
      primaryUse: null,
      industry: null,
    });
  }

  useHotkeys(["esc"], () => {
    if (completeOnboarding.isPending) {
      return;
    }

    handleSkip();
  });

  useHotkeys(["mod+enter"], () => {
    if (completeOnboarding.isPending) {
      return;
    }

    form.handleSubmit(onSubmit)();
  });

  return (
    <Form {...form}>
      <form
        className="flex flex-col gap-6"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <FormField
          control={form.control}
          name="workType"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-medium text-base">
                What best describes your work?
              </FormLabel>
              <FormControl>
                <Select
                  onValueChange={field.onChange}
                  value={field.value ?? ""}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select your work situation..." />
                  </SelectTrigger>
                  <SelectContent>
                    {WORK_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="primaryUse"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-medium text-base">
                What will you track?
              </FormLabel>
              <FormControl>
                <Select
                  onValueChange={field.onChange}
                  value={field.value ?? ""}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select what you'll track..." />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIMARY_USES.map((use) => (
                      <SelectItem key={use.value} value={use.value}>
                        {use.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="industry"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-medium text-base">
                Your field?{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </FormLabel>
              <FormControl>
                <IndustrySelect onChange={field.onChange} value={field.value} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter>
          <DialogClose asChild>
            <Button
              disabled={completeOnboarding.isPending}
              onClick={handleSkip}
              variant="outline"
            >
              Skip for now <Kbd variant="outline">{SHORTCUTS_VALUES.ESC}</Kbd>
            </Button>
          </DialogClose>
          <Button disabled={completeOnboarding.isPending} type="submit">
            Continue
            <Kbd>
              {SHORTCUTS_VALUES.CMD} + {SHORTCUTS_VALUES.ENTER}
            </Kbd>
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
