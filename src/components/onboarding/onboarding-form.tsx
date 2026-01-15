'use client'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PRIMARY_USES, WORK_TYPES } from '@/constants/onboarding'
import { INDUSTRIES } from '@/constants/onboarding'
import { trpc } from '@/lib/trpc/client'
import { sleep } from '@/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { useHotkeys } from 'react-hotkeys-hook'
import { toast } from 'sonner'
import { z } from 'zod'
import { DialogClose, DialogFooter } from '../ui/dialog'
import { Kbd, SHORTCUTS_VALUES } from '../ui/kbd'
import { IndustrySelect } from './industry-select'

const industryValues = INDUSTRIES.map((i) => i.value) as [string, ...string[]]

const onboardingSchema = z.object({
  workType: z
    .enum([
      'employed',
      'self_employed',
      'business_owner',
      'student',
      'retired',
      'unemployed',
    ])
    .nullable(),
  primaryUse: z.enum(['personal', 'business', 'both']).nullable(),
  industry: z.enum(industryValues).nullable(),
})

type OnboardingFormValues = z.infer<typeof onboardingSchema>

const TOAST_ID = 'onboarding'

export function OnboardingForm() {
  const router = useRouter()

  const completeOnboarding = trpc.onboarding.complete.useMutation({
    onSuccess: async () => {
      await sleep(3_000 + Math.random() * 2_000)
      toast.success('Custom categories created for you!', {
        id: TOAST_ID,
        description:
          "We've just customized your account setup to your needs. You can always change it later.",
      })
      router.refresh()
    },
    onError: (error) => {
      toast.error(error.message, { id: TOAST_ID })
    },
  })

  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      workType: null,
      primaryUse: null,
      industry: null,
    },
  })

  async function onSubmit(values: OnboardingFormValues) {
    toast.loading('Tailoring Bugdet for you...', { id: TOAST_ID })
    completeOnboarding.mutate(values)
  }

  function handleSkip() {
    toast.loading('Tailoring Bugdet for you...', { id: TOAST_ID })
    completeOnboarding.mutate({
      workType: null,
      primaryUse: null,
      industry: null,
    })
  }

  useHotkeys(['esc'], () => {
    if (completeOnboarding.isPending) {
      return
    }

    handleSkip()
  })

  useHotkeys(['mod+enter'], () => {
    if (completeOnboarding.isPending) {
      return
    }

    form.handleSubmit(onSubmit)()
  })

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-6"
      >
        <FormField
          control={form.control}
          name="workType"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-medium">
                What best describes your work?
              </FormLabel>
              <FormControl>
                <Select
                  value={field.value ?? ''}
                  onValueChange={field.onChange}
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
              <FormLabel className="text-base font-medium">
                What will you track?
              </FormLabel>
              <FormControl>
                <Select
                  value={field.value ?? ''}
                  onValueChange={field.onChange}
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
              <FormLabel className="text-base font-medium">
                Your field?{' '}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </FormLabel>
              <FormControl>
                <IndustrySelect value={field.value} onChange={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter>
          <DialogClose asChild>
            <Button
              variant="outline"
              onClick={handleSkip}
              disabled={completeOnboarding.isPending}
            >
              Skip for now <Kbd variant="outline">{SHORTCUTS_VALUES.ESC}</Kbd>
            </Button>
          </DialogClose>
          <Button type="submit" disabled={completeOnboarding.isPending}>
            Continue
            <Kbd>
              {SHORTCUTS_VALUES.CMD} + {SHORTCUTS_VALUES.ENTER}
            </Kbd>
          </Button>
        </DialogFooter>
      </form>
    </Form>
  )
}
