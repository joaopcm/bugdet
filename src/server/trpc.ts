import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { db } from "@/db";
import { env } from "@/env";
import { auth } from "@/lib/auth/auth";
import { getOrCreateTenant, type TenantContext } from "@/lib/tenant";

export async function createTRPCContext(opts: { headers: Headers }) {
  const authSession = await auth.api.getSession({
    headers: opts.headers,
  });

  return {
    db,
    headers: opts.headers,
    user: authSession?.user,
  };
}
type Context = Awaited<ReturnType<typeof createTRPCContext>>;

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter: ({ shape, error }) => ({
    ...shape,
    data: {
      ...shape.data,
      zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
    },
  }),
});

export const createCallerFactory = t.createCallerFactory;
export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user?.id) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to access this resource.",
    });
  }

  let tenant: TenantContext;
  try {
    tenant = await getOrCreateTenant(ctx.user.id);
  } catch (error) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to resolve tenant context.",
      cause: error,
    });
  }

  return next({
    ctx: {
      user: ctx.user,
      tenant,
    },
  });
});

export interface ProtectedContext {
  user: NonNullable<Awaited<ReturnType<typeof createTRPCContext>>["user"]>;
  tenant: TenantContext;
}

export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  const adminEmails = env.ADMIN_EMAILS.split(",")
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.length > 0);

  if (!adminEmails.includes(ctx.user.email.toLowerCase())) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Admin access required.",
    });
  }

  return next({ ctx });
});
