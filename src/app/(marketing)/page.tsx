'use client'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { trpc } from '@/lib/trpc/client'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

const waitlistSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
})

type WaitlistFormValues = z.infer<typeof waitlistSchema>

export default function WaitlistPage() {
  const [isSubmitted, setIsSubmitted] = useState(false)

  const form = useForm<WaitlistFormValues>({
    resolver: zodResolver(waitlistSchema),
    defaultValues: {
      email: '',
    },
  })

  const joinWaitlist = trpc.waitlist.join.useMutation({
    onSuccess: (data) => {
      setIsSubmitted(true)
      toast.success(data.message)
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  function onSubmit(values: WaitlistFormValues) {
    joinWaitlist.mutate({ email: values.email })
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-md">
        <div className="flex flex-col gap-8 text-center">
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-bold tracking-tight">Bugdet.co</h1>
            <p className="text-muted-foreground text-lg">
              Your financial state, with the ease of AI.
            </p>
          </div>

          <div className="flex flex-col gap-4 text-left">
            <div className="flex items-start gap-3">
              <div className="mt-1 rounded-full bg-primary/10 p-1">
                <CheckCircle2 className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium">Import bank statements</p>
                <p className="text-muted-foreground text-sm">
                  Upload PDFs and let AI extract your transactions automatically
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 rounded-full bg-primary/10 p-1">
                <CheckCircle2 className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium">Smart categorization</p>
                <p className="text-muted-foreground text-sm">
                  AI-powered rules learn your spending patterns over time
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 rounded-full bg-primary/10 p-1">
                <CheckCircle2 className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium">Clear insights</p>
                <p className="text-muted-foreground text-sm">
                  Understand where your money goes with intuitive dashboards
                </p>
              </div>
            </div>
          </div>

          {isSubmitted ? (
            <div className="rounded-lg border bg-card p-6">
              <div className="flex flex-col items-center gap-3">
                <div className="rounded-full bg-green-500/10 p-3">
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-lg font-semibold">You're on the list!</p>
                  <p className="text-muted-foreground text-sm">
                    We'll notify you when you're granted access.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border bg-card p-6">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="flex flex-col gap-4"
                >
                  <div className="flex flex-col gap-2">
                    <p className="font-medium">Join the waitlist</p>
                    <p className="text-muted-foreground text-sm">
                      Be first to know when we launch.
                    </p>
                  </div>

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            placeholder="you@example.com"
                            type="email"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={joinWaitlist.isPending}
                  >
                    {joinWaitlist.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Joining...
                      </>
                    ) : (
                      'Join waitlist'
                    )}
                  </Button>
                </form>
              </Form>
            </div>
          )}

          <p className="text-muted-foreground text-sm">
            Already have access?{' '}
            <Link href="/sign-in" className="underline underline-offset-4">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
