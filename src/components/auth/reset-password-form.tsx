"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
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

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(6, { message: "Password must be at least 6 characters" }),
    confirmPassword: z
      .string()
      .min(6, { message: "Password must be at least 6 characters" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

interface ResetPasswordFormProps {
  token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: ResetPasswordFormValues) {
    setIsLoading(true);

    const { error } = await authClient.resetPassword({
      newPassword: values.password,
      token,
    });
    if (error) {
      toast.error(error.message);
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
    setIsSubmitted(true);
  }

  if (isSubmitted) {
    return (
      <AuthContainer>
        <div className="p-6 md:p-8">
          <div className="flex flex-col gap-6">
            <AuthContainerHeader
              description="Your password has been reset. You can now login with your new password."
              title="You're all set"
            />

            <Button asChild className="w-full">
              <Link href="/sign-in">Login</Link>
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
              description="Enter your new password"
              title="Reset your password"
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="password">Password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="confirmPassword">
                    Confirm Password
                  </FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
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
