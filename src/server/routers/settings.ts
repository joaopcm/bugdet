import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { z } from "zod";
import { db } from "@/db";
import { userSettings } from "@/db/schema";
import {
  DEFAULT_MODE,
  DEFAULT_PRESET,
  serializeThemeCookie,
  THEME_COOKIE,
  THEME_COOKIE_MAX_AGE,
} from "@/lib/themes/cookie";
import { PRESET_SLUGS } from "@/lib/themes/presets.generated";
import { protectedProcedure, router } from "../trpc";

const themePresetSchema = z.enum(PRESET_SLUGS as [string, ...string[]]);
const colorModeSchema = z.enum(["light", "dark", "system"]);

export const settingsRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => {
    const [row] = await db
      .select({
        themePreset: userSettings.themePreset,
        colorMode: userSettings.colorMode,
      })
      .from(userSettings)
      .where(eq(userSettings.userId, ctx.user.id));

    return {
      themePreset: row?.themePreset ?? DEFAULT_PRESET,
      colorMode: row?.colorMode ?? DEFAULT_MODE,
    };
  }),

  updateTheme: protectedProcedure
    .input(
      z.object({
        themePreset: themePresetSchema,
        colorMode: colorModeSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      await db
        .insert(userSettings)
        .values({
          userId: ctx.user.id,
          themePreset: input.themePreset,
          colorMode: input.colorMode,
        })
        .onConflictDoUpdate({
          target: userSettings.userId,
          set: {
            themePreset: input.themePreset,
            colorMode: input.colorMode,
          },
        });

      const cookieStore = await cookies();
      cookieStore.set(
        THEME_COOKIE,
        serializeThemeCookie({
          preset: input.themePreset,
          mode: input.colorMode,
        }),
        {
          maxAge: THEME_COOKIE_MAX_AGE,
          path: "/",
          sameSite: "lax",
        }
      );

      return { success: true };
    }),
});
