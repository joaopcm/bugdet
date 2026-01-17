"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
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
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth/client";
import { AuthContainer, AuthContainerHeader } from "./container";

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(values: ForgotPasswordFormValues) {
    setIsLoading(true);

    const { error } = await authClient.requestPasswordReset({
      email: values.email,
      redirectTo: "/reset-password",
    });
    if (error) {
      toast.error(error.message);
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
    setIsSubmitted(true);
  }

  async function reSendEmail() {
    setIsLoading(true);

    const { error } = await authClient.requestPasswordReset({
      email: form.getValues("email"),
      redirectTo: "/reset-password",
    });
    if (error) {
      toast.error(error.message);
    }

    setIsLoading(false);
  }

  if (isSubmitted) {
    return (
      <AuthContainer>
        <div className="p-6 md:p-8">
          <div className="flex flex-col gap-6">
            <AuthContainerHeader
              description="We just sent you a password reset email"
              title="Check your inbox"
            />

            <p className="text-center">
              Please check your inbox and click the link to reset your password.
            </p>

            <Button
              className="w-full"
              disabled={isLoading}
              onClick={reSendEmail}
            >
              Re-send password reset email
            </Button>
          </div>
        </div>
      </AuthContainer>
    );
  }

  return (
    <AuthContainer>
      <Form {...form}>
        <form className="p-6 md:p-8" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="flex flex-col gap-6">
            <AuthContainerHeader
              description="Enter your email to reset your password"
              title="Reset your password"
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="email">Email</FormLabel>
                  <FormControl>
                    <Input
                      id="email"
                      placeholder="m@example.com"
                      type="email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button className="w-full" disabled={isLoading} type="submit">
              Reset password
            </Button>
          </div>
        </form>
      </Form>
    </AuthContainer>
  );
}
