"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LayoutDashboard, Sparkles, UploadCloud } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
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
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc/client";

const waitlistSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
});

type WaitlistFormValues = z.infer<typeof waitlistSchema>;

export default function WaitlistPage() {
  const form = useForm<WaitlistFormValues>({
    resolver: zodResolver(waitlistSchema),
    defaultValues: {
      email: "",
    },
  });

  const joinWaitlist = trpc.waitlist.join.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      form.reset();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  function onSubmit(values: WaitlistFormValues) {
    joinWaitlist.mutate({ email: values.email });
  }

  return (
    <div className="flex min-h-svh flex-col bg-background font-sans">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <Image
              alt="Bugdet.co"
              className="rounded-lg"
              height={32}
              priority
              src="/images/android-chrome-192x192.png"
              width={32}
            />
            <span>Bugdet.co</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link
              className="font-medium text-sm underline-offset-4 hover:underline"
              href="/sign-in"
            >
              Sign in
            </Link>
            <Button asChild className="hidden sm:flex" size="sm">
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
            <div className="mx-auto flex max-w-3xl flex-col items-center gap-8 text-center">
              <div className="inline-flex items-center rounded-full border bg-muted px-3 py-1 font-medium text-sm">
                <span className="mr-2 flex h-2 w-2 rounded-full bg-green-500" />
                Now accepting early access requests
              </div>
              <h1 className="font-extrabold text-4xl tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                Your financial state, <br />
                <span className="text-primary">clarified by AI.</span>
              </h1>
              <p className="max-w-[42rem] text-muted-foreground text-xl leading-relaxed">
                Stop manually categorizing spreadsheets. Upload your bank
                statements and let our AI engine categorize, analyze, and
                visualize your spending habits in seconds.
              </p>

              <div className="w-full max-w-md pt-4">
                <div className="w-full scroll-mt-24" id="waitlist">
                  <Form {...form}>
                    <form
                      className="flex w-full flex-col gap-2 sm:flex-row"
                      onSubmit={form.handleSubmit(onSubmit)}
                    >
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input
                                className="h-12"
                                placeholder="m.example.com"
                                type="email"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        className="h-12 px-8"
                        disabled={joinWaitlist.isPending}
                        type="submit"
                      >
                        Join waitlist
                      </Button>
                    </form>
                  </Form>
                  <p className="mt-3 text-muted-foreground text-xs">
                    Join others in the waitlist for access. No spam, ever.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Mockup / Visual Section */}
        <section className="container mx-auto px-4 pb-24 md:px-6">
          <Image
            alt="Dashboard Preview"
            className="w-full object-cover"
            height={800}
            priority
            src="/dashboard-screenshot.png"
            width={1200}
          />
        </section>

        {/* Features Grid */}
        <section className="bg-muted/30 py-24">
          <div className="container mx-auto px-4 md:px-6">
            <div className="mb-16 text-center">
              <h2 className="mb-4 font-bold text-3xl tracking-tight sm:text-4xl">
                Everything you need to master your money
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
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
  );
}
