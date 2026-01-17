import Image from "next/image";
import Link from "next/link";
import type { PropsWithChildren } from "react";
import { env } from "@/env";
import { Card, CardContent } from "../ui/card";

interface AuthContainerProps extends PropsWithChildren {
  imageSource?: string;
}

export function AuthContainer({
  children,
  imageSource = "/free-user.png",
}: AuthContainerProps) {
  return (
    <div className="flex flex-col gap-6">
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          {children}

          <div className="relative hidden bg-muted md:block">
            <Image
              alt="Side illustration"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
              height={500}
              priority
              src={imageSource}
              width={500}
            />
          </div>
        </CardContent>
      </Card>

      <div className="text-balance text-center text-muted-foreground text-xs *:[a]:underline *:[a]:underline-offset-4 *:[a]:hover:text-primary">
        By clicking continue, you agree to our{" "}
        <Link href={`${env.NEXT_PUBLIC_APP_URL}/terms-of-service`}>
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href={`${env.NEXT_PUBLIC_APP_URL}/privacy-policy`}>
          Privacy Policy
        </Link>
        .
      </div>
    </div>
  );
}

interface AuthContainerHeaderProps {
  title: string;
  description: string;
}

export function AuthContainerHeader({
  title,
  description,
}: AuthContainerHeaderProps) {
  return (
    <div className="flex flex-col items-center text-center">
      <h1 className="font-bold text-2xl">{title}</h1>
      <p className="text-balance text-muted-foreground">{description}</p>
    </div>
  );
}
