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

const signUpSchema = z
  .object({
    name: z.string().min(1, { message: "Name is required" }).max(255),
    email: z.string().email({ message: "Please enter a valid email address" }),
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

type SignUpFormValues = z.infer<typeof signUpSchema>;

export function SignUpForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: SignUpFormValues) {
    setIsLoading(true);

    const { error } = await authClient.signUp.email({
      name: values.name,
      email: values.email,
      password: values.password,
      callbackURL: "/dashboard",
    });
    if (error) {
      toast.error(error.message);
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
    setIsSubmitted(true);
  }

  async function reSendVerificationEmail() {
    setIsLoading(true);

    const { error } = await authClient.sendVerificationEmail({
      email: form.getValues("email"),
      callbackURL: "/dashboard",
    });
    if (error) {
      toast.error(error.message);
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
    toast.success("Verification email sent");
  }

  if (isSubmitted) {
    return (
      <AuthContainer>
        <div className="p-6 md:p-8">
          <div className="flex flex-col gap-6">
            <AuthContainerHeader
              description="We just sent you a verification email"
              title="Check your inbox"
            />

            <p className="text-center">
              Please check your inbox and click the link to verify your account.
            </p>

            <Button
              className="w-full"
              disabled={isLoading}
              onClick={reSendVerificationEmail}
            >
              Re-send verification email
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
              description="Create your Bugdet account to get started"
              title="Create an account"
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="name">Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Theo" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="email">Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="m@example.com"
                      type="email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
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
              Sign up
            </Button>

            <div className="text-center text-sm">
              Already have an account?{" "}
              <Link className="underline underline-offset-4" href="/sign-in">
                Sign in
              </Link>
            </div>
          </div>
        </form>
      </Form>
    </AuthContainer>
  );
}
