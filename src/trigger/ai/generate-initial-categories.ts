import { logger, task } from "@trigger.dev/sdk/v3";
import { generateObject } from "ai";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { INDUSTRIES, PRIMARY_USES, WORK_TYPES } from "@/constants/onboarding";
import { db } from "@/db";
import { category, userProfile } from "@/db/schema";
import { getUserIdFromTenant } from "@/lib/tenant";

const UNIVERSAL_CATEGORIES = [
  "Salary/Wages",
  "Transfers",
  "Housing",
  "Utilities",
  "Groceries",
  "Transportation",
  "Healthcare",
  "Insurance",
  "Subscriptions",
  "Dining Out",
  "Shopping",
  "Entertainment",
];

const additionalCategoriesSchema = z.object({
  categories: z
    .array(z.string())
    .describe(
      "Additional category names tailored to the user profile. Keep names concise (1-3 words). Return 3-8 categories maximum."
    ),
});

function buildSystemPrompt() {
  return `You are a financial expert helping users organize their expenses.

Your task is to suggest additional expense/income categories based on a user's profile.

## Rules
- Suggest 3-8 additional categories maximum
- Keep category names concise (1-3 words)
- Make categories specific but not too narrow
- Consider both income and expense categories relevant to the profile
- DO NOT suggest categories that overlap with these universal ones: ${UNIVERSAL_CATEGORIES.join(", ")}

## Examples by profile:
- Self-employed/Freelancer: "Client Payments", "Business Supplies", "Professional Development"
- Business Owner: "Revenue", "Payroll", "Office Expenses", "Marketing"
- Student: "Tuition", "Books", "Student Loans"
- Teacher: "Classroom Supplies", "Professional Development"
- Tech Worker: "Software Tools", "Tech Equipment", "Conferences"
- Healthcare Worker: "Continuing Education", "Licensing Fees"
- Creative Professional: "Equipment", "Portfolio Costs", "Licensing"`;
}

const INDUSTRY_LABELS = Object.fromEntries(
  INDUSTRIES.map((i) => [i.value, i.label])
);

const WORK_TYPE_LABELS = Object.fromEntries(
  WORK_TYPES.map((w) => [w.value, w.label])
);

const PRIMARY_USE_LABELS = Object.fromEntries(
  PRIMARY_USES.map((p) => [p.value, p.label])
);

function buildUserPrompt(profile: {
  workType: string | null;
  primaryUse: string | null;
  industry: string | null;
}) {
  const parts: string[] = [];

  if (profile.workType) {
    parts.push(
      `Work situation: ${WORK_TYPE_LABELS[profile.workType] ?? profile.workType}`
    );
  }

  if (profile.primaryUse) {
    parts.push(
      `Tracking: ${PRIMARY_USE_LABELS[profile.primaryUse] ?? profile.primaryUse}`
    );
  }

  if (profile.industry) {
    const industryLabel = INDUSTRY_LABELS[profile.industry] ?? profile.industry;
    parts.push(`Industry/field: ${industryLabel}`);
  }

  if (parts.length === 0) {
    return "No profile information provided. Suggest general-purpose categories that complement the universal ones.";
  }

  return `User profile:
${parts.join("\n")}

Based on this profile, suggest additional categories that would be useful for this user. Remember to avoid duplicating the universal categories.`;
}

export interface GenerateInitialCategoriesPayload {
  tenantId: string;
}

export const generateInitialCategoriesTask = task({
  id: "generate-initial-categories",
  retry: {
    randomize: false,
  },
  run: async (payload: GenerateInitialCategoriesPayload) => {
    logger.info("Generating initial categories for tenant");

    const userId = await getUserIdFromTenant(payload.tenantId);
    if (!userId) {
      logger.error("Tenant not found");
      return { success: false, categoriesCreated: 0, categories: [] };
    }

    const [profile] = await db
      .select({
        workType: userProfile.workType,
        primaryUse: userProfile.primaryUse,
        industry: userProfile.industry,
      })
      .from(userProfile)
      .where(eq(userProfile.userId, userId));

    const categoriesToCreate = [...UNIVERSAL_CATEGORIES];

    if (
      profile &&
      (profile.workType || profile.primaryUse || profile.industry)
    ) {
      logger.info("Generating AI-suggested categories based on profile", {
        profile,
      });

      const result = await generateObject({
        model: "anthropic/claude-haiku-4.5",
        mode: "json",
        schemaName: "additional-categories",
        schemaDescription: "Additional categories based on user profile",
        schema: additionalCategoriesSchema,
        messages: [
          { role: "system", content: buildSystemPrompt() },
          { role: "user", content: buildUserPrompt(profile) },
        ],
      });

      const aiCategories = result.object.categories
        .map((c) => c.trim())
        .filter((c) => c.length > 0)
        .filter(
          (c) =>
            !UNIVERSAL_CATEGORIES.some(
              (u) => u.toLowerCase() === c.toLowerCase()
            )
        )
        .slice(0, 8);

      logger.info(`AI suggested ${aiCategories.length} additional categories`, {
        aiCategories,
      });

      categoriesToCreate.push(...aiCategories);
    }

    const existingCategories = await db
      .select({ name: category.name })
      .from(category)
      .where(eq(category.tenantId, payload.tenantId));

    const existingNames = new Set(
      existingCategories.map((c) => c.name.toLowerCase())
    );

    const newCategories = categoriesToCreate.filter(
      (name) => !existingNames.has(name.toLowerCase())
    );

    if (newCategories.length === 0) {
      logger.info("All categories already exist, skipping insertion");
      return {
        success: true,
        categoriesCreated: 0,
        categories: [],
      };
    }

    const insertedCategories = await db
      .insert(category)
      .values(
        newCategories.map((name) => ({
          name,
          tenantId: payload.tenantId,
        }))
      )
      .returning({ id: category.id, name: category.name });

    logger.info(`Created ${insertedCategories.length} categories for tenant`, {
      insertedCategories,
    });

    return {
      success: true,
      categoriesCreated: insertedCategories.length,
      categories: insertedCategories.map((c) => c.name),
    };
  },
});
