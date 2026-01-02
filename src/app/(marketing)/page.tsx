'use client'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
import { LayoutDashboard, Sparkles, UploadCloud } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

const waitlistSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
})

type WaitlistFormValues = z.infer<typeof waitlistSchema>

export default function WaitlistPage() {
  const form = useForm<WaitlistFormValues>({
    resolver: zodResolver(waitlistSchema),
    defaultValues: {
      email: '',
    },
  })

  const joinWaitlist = trpc.waitlist.join.useMutation({
    onSuccess: (data) => {
      toast.success(data.message)
      form.reset()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  function onSubmit(values: WaitlistFormValues) {
    joinWaitlist.mutate({ email: values.email })
  }

  return (
    <div className="flex min-h-svh flex-col bg-background font-sans">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <Image
              src="/images/android-chrome-192x192.png"
              alt="Bugdet.co"
              width={32}
              height={32}
              className="rounded-lg"
              priority
            />
            <span>Bugdet.co</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link
              href="/sign-in"
              className="text-sm font-medium hover:underline underline-offset-4"
            >
              Sign in
            </Link>
            <Button asChild size="sm" className="hidden sm:flex">
              <Link href="#waitlist">Get access</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-24 md:py-32 lg:py-40">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-primary/20 via-background to-background" />
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center text-center gap-8 max-w-3xl mx-auto">
              <div className="inline-flex items-center rounded-full border bg-muted px-3 py-1 text-sm font-medium">
                <span className="flex h-2 w-2 rounded-full bg-green-500 mr-2" />
                Now accepting early access requests
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                Your financial state, <br />
                <span className="text-primary">clarified by AI.</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-[42rem] leading-relaxed">
                Stop manually categorizing spreadsheets. Upload your bank
                statements and let our AI engine categorize, analyze, and
                visualize your spending habits in seconds.
              </p>

              <div className="w-full max-w-md pt-4">
                <div className="w-full scroll-mt-24" id="waitlist">
                  <Form {...form}>
                    <form
                      onSubmit={form.handleSubmit(onSubmit)}
                      className="flex w-full flex-col gap-2 sm:flex-row"
                    >
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input
                                placeholder="m.example.com"
                                type="email"
                                className="h-12"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="submit"
                        className="h-12 px-8"
                        disabled={joinWaitlist.isPending}
                      >
                        Join waitlist
                      </Button>
                    </form>
                  </Form>
                  <p className="text-xs text-muted-foreground mt-3">
                    Join others in the waitlist for access. No spam, ever.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Mockup / Visual Section */}
        <section className="container mx-auto px-4 md:px-6 pb-24">
          <Image
            src="/dashboard-screenshot.png"
            alt="Dashboard Preview"
            width={1200}
            height={800}
            className="w-full object-cover"
            priority
          />
        </section>

        {/* Features Grid */}
        <section className="py-24 bg-muted/30">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
                Everything you need to master your money
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                We combine the power of AI with intuitive design to give you a
                complete picture of your finances.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <UploadCloud className="h-6 w-6" />
                  </div>
                  <CardTitle>Seamless imports</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    Drag and drop your PDF bank statements. We handle the
                    parsing, data extraction, and deduplication automatically.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <CardTitle>AI categorization</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    Our AI learns from your edits. Create custom rules like
                    "Transactions over $100 at Target are Gifts" and watch them
                    apply automatically.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <LayoutDashboard className="h-6 w-6" />
                  </div>
                  <CardTitle>Instant clarity</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    Visualize your spending patterns with interactive charts.
                    Spot trends, identify outliers, and stay on top of your
                    budget.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
