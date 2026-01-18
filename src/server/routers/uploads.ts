import { randomUUID } from "node:crypto";
import { tasks } from "@trigger.dev/sdk/v3";
import { TRPCError } from "@trpc/server";
import { generateObject } from "ai";
import { and, desc, eq, ilike, inArray } from "drizzle-orm";
import { z } from "zod";
import { CANCELLABLE_STATUSES, DELETABLE_STATUSES } from "@/constants/uploads";
import { db } from "@/db";
import { type CsvQuestion, transaction, upload } from "@/db/schema";
import { encryptPassword } from "@/lib/crypto";
import { createClient } from "@/lib/supabase/server";
import { paginationSchema } from "@/schemas/pagination";
import { protectedProcedure, router } from "../trpc";

const csvQuestionSchema = z.object({
  id: z.string(),
  type: z.enum(["text", "select", "date", "boolean"]),
  label: z.string(),
  description: z.string().optional(),
  options: z.array(z.string()).optional(),
  required: z.boolean(),
  defaultValue: z.string().optional(),
});

const csvAnalysisResultSchema = z.object({
  questions: z.array(csvQuestionSchema),
  inferredMapping: z.object({
    dateColumn: z.string().optional(),
    merchantColumn: z.string().optional(),
    amountColumn: z.string().optional(),
    descriptionColumn: z.string().optional(),
  }),
});

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

const LINE_BREAK_REGEX = /\r?\n/;

function parseCsvContent(
  content: string,
  maxRows = 50
): { headers: string[]; rows: string[][] } {
  const lines = content
    .split(LINE_BREAK_REGEX)
    .filter((line) => line.trim().length > 0);
  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = parseCsvLine(lines[0]);
  const rows = lines.slice(1, maxRows + 1).map((line) => parseCsvLine(line));

  return { headers, rows };
}

function buildCsvAnalysisPrompt(headers: string[], sampleRows: string[][]) {
  const rowsText = sampleRows
    .slice(0, 20)
    .map((row, i) => `${i + 1}. ${row.join(" | ")}`)
    .join("\n");

  return `Analyze this CSV bank statement export.

## CSV Headers
${headers.join(", ")}

## Sample Rows (first 20)
${rowsText}

## YOUR TASK
1. INFER COLUMN MAPPING: Identify which columns contain:
   - Date (and likely format)
   - Merchant/Description
   - Amount (or separate credit/debit columns)
   - Optional: description/memo column

2. GENERATE QUESTIONS: Create minimal questions for context you cannot infer.
   Only ask what's truly needed for accurate extraction.

   Consider asking about:
   - Bank name (helps identify merchant patterns)
   - Currency (critical if not in CSV)
   - Account type (checking/savings/credit card)
   - Date format (only if ambiguous between MM/DD and DD/MM)
   - Sign convention (only if unclear whether positive = expense or income)

   Rules for questions:
   - Use "text" type for open-ended answers (bank name, currency)
   - Use "select" type when there are clear options (account type, date format)
   - Use "boolean" type for yes/no questions (sign convention)
   - Keep questions concise but clear
   - Only ask 2-4 questions maximum
   - Don't ask about things you can clearly infer from the data`;
}

async function getExistingUpload(id: string, tenantId: string) {
  const [existingUpload] = await db
    .select({
      id: upload.id,
      deleted: upload.deleted,
      status: upload.status,
      filePath: upload.filePath,
      pageCount: upload.pageCount,
      pdfDeleted: upload.pdfDeleted,
      retryCount: upload.retryCount,
    })
    .from(upload)
    .where(and(eq(upload.id, id), eq(upload.tenantId, tenantId)));

  if (!existingUpload || existingUpload.deleted) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Upload not found.",
    });
  }

  return existingUpload;
}

function getPageImagePaths(
  uploadId: string,
  pageCount: number | null
): string[] {
  if (!pageCount || pageCount === 0) {
    return [];
  }
  return Array.from(
    { length: pageCount },
    (_, i) => `${uploadId}/page-${i + 1}.png`
  );
}

export interface SignedUploadUrl {
  signedUrl: string;
  token: string;
  path: string;
  originalFileName: string;
}

export const uploadsRouter = router({
  listForFilter: protectedProcedure.query(async ({ ctx }) => {
    const uploads = await ctx.db
      .select({
        id: upload.id,
        fileName: upload.fileName,
        createdAt: upload.createdAt,
      })
      .from(upload)
      .where(
        and(
          eq(upload.tenantId, ctx.tenant.tenantId),
          eq(upload.deleted, false),
          eq(upload.status, "completed")
        )
      )
      .orderBy(desc(upload.createdAt));

    return { data: uploads };
  }),
  createSignedUploadUrls: protectedProcedure
    .input(z.object({ fileNames: z.array(z.string()).min(1).max(10) }))
    .mutation(async ({ input }) => {
      const supabase = await createClient({ admin: true });
      const uploadUrls: SignedUploadUrl[] = [];

      for (const fileName of input.fileNames) {
        const extension = fileName.split(".").pop();
        const uniqueFileName = `${randomUUID()}.${extension}`;
        const { data: uploadUrl, error: uploadUrlError } =
          await supabase.storage
            .from("bank-statements")
            .createSignedUploadUrl(uniqueFileName, {
              upsert: true,
            });

        if (uploadUrlError) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to create signed upload url for ${fileName}: ${uploadUrlError.message}`,
          });
        }

        uploadUrls.push({
          ...uploadUrl,
          originalFileName: fileName,
        });
      }

      return {
        uploadUrls,
      };
    }),
  process: protectedProcedure
    .input(
      z.object({
        files: z
          .array(
            z.object({
              fileName: z.string(),
              fileSize: z.number(),
              filePath: z.string(),
            })
          )
          .max(10)
          .min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { files } = input;

      const newUploads = await ctx.db
        .insert(upload)
        .values(
          files.map((file) => ({
            tenantId: ctx.tenant.tenantId,
            fileName: file.fileName,
            filePath: file.filePath,
            fileSize: file.fileSize,
          }))
        )
        .returning({
          id: upload.id,
        });

      await tasks.batchTrigger(
        "upload-breakdown",
        newUploads.map((u) => ({
          payload: {
            uploadId: u.id,
          },
        }))
      );
    }),
  list: protectedProcedure
    .input(
      z.object({
        filters: z.object({
          query: z.string().min(1).max(255).nullable(),
        }),
        pagination: paginationSchema,
      })
    )
    .query(async ({ ctx, input }) => {
      const whereClauses = [
        eq(upload.tenantId, ctx.tenant.tenantId),
        eq(upload.deleted, false),
      ];

      if (input.filters.query) {
        whereClauses.push(ilike(upload.fileName, `%${input.filters.query}%`));
      }

      const offset = (input.pagination.page - 1) * input.pagination.limit;

      const uploads = await db
        .select({
          id: upload.id,
          fileName: upload.fileName,
          filePath: upload.filePath,
          fileSize: upload.fileSize,
          status: upload.status,
          failedReason: upload.failedReason,
          metadata: upload.metadata,
          pdfDeleted: upload.pdfDeleted,
          retryCount: upload.retryCount,
          createdAt: upload.createdAt,
        })
        .from(upload)
        .where(and(...whereClauses))
        .orderBy(desc(upload.createdAt))
        .limit(input.pagination.limit + 1)
        .offset(offset);

      return {
        data: uploads.slice(0, input.pagination.limit),
        hasMore: uploads.length > input.pagination.limit,
      };
    }),
  cancel: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const { id } = input;

      const existingUpload = await getExistingUpload(id, ctx.tenant.tenantId);

      if (!CANCELLABLE_STATUSES.includes(existingUpload.status)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Upload is not cancellable.",
        });
      }

      await ctx.db
        .update(upload)
        .set({ status: "cancelled" })
        .where(eq(upload.id, existingUpload.id));
    }),
  retry: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const { id } = input;

      const existingUpload = await getExistingUpload(id, ctx.tenant.tenantId);

      if (existingUpload.status !== "failed") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only failed uploads can be retried.",
        });
      }

      if (existingUpload.pdfDeleted) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot retry: original PDF has been deleted.",
        });
      }

      if (existingUpload.retryCount >= 3) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Maximum retry attempts reached (3).",
        });
      }

      const supabase = await createClient({ admin: true });

      const pageImagePaths = getPageImagePaths(
        existingUpload.id,
        existingUpload.pageCount
      );
      if (pageImagePaths.length > 0) {
        await supabase.storage.from("bank-statements").remove(pageImagePaths);
      }

      await ctx.db
        .update(upload)
        .set({
          status: "queued",
          failedReason: null,
          pageCount: null,
          metadata: null,
          retryCount: existingUpload.retryCount + 1,
        })
        .where(eq(upload.id, existingUpload.id));

      await tasks.trigger("upload-breakdown", { uploadId: existingUpload.id });

      return { success: true };
    }),
  delete: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        deleteRelatedTransactions: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { id } = input;

      const existingUpload = await getExistingUpload(id, ctx.tenant.tenantId);

      if (!DELETABLE_STATUSES.includes(existingUpload.status)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Upload is not deletable.",
        });
      }

      const supabase = await createClient({ admin: true });

      const pageImagePaths = getPageImagePaths(
        existingUpload.id,
        existingUpload.pageCount
      );
      const { error: deleteFileError } = await supabase.storage
        .from("bank-statements")
        .remove([existingUpload.filePath, ...pageImagePaths]);

      if (deleteFileError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to delete ${existingUpload.filePath}: ${deleteFileError.message}`,
        });
      }

      await ctx.db.transaction(async (tx) => {
        await tx
          .update(upload)
          .set({ deleted: true })
          .where(
            and(
              eq(upload.id, existingUpload.id),
              eq(upload.tenantId, ctx.tenant.tenantId)
            )
          );

        if (input.deleteRelatedTransactions) {
          await tx
            .update(transaction)
            .set({ deleted: true })
            .where(
              and(
                eq(transaction.uploadId, existingUpload.id),
                eq(transaction.tenantId, ctx.tenant.tenantId)
              )
            );
        }
      });
    }),
  deleteMany: protectedProcedure
    .input(
      z.object({
        ids: z.array(z.string().uuid()).min(1).max(100),
        deleteRelatedTransactions: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const uploadsToDelete = await ctx.db
        .select({
          id: upload.id,
          filePath: upload.filePath,
          pageCount: upload.pageCount,
        })
        .from(upload)
        .where(
          and(
            inArray(upload.id, input.ids),
            eq(upload.tenantId, ctx.tenant.tenantId),
            eq(upload.deleted, false),
            inArray(upload.status, DELETABLE_STATUSES)
          )
        );

      if (uploadsToDelete.length === 0) {
        return { deletedCount: 0 };
      }

      const supabase = await createClient({ admin: true });
      const filesToDelete = uploadsToDelete.flatMap((u) => [
        u.filePath,
        ...getPageImagePaths(u.id, u.pageCount),
      ]);
      await supabase.storage.from("bank-statements").remove(filesToDelete);

      // Soft delete uploads and optionally transactions
      const uploadIds = uploadsToDelete.map((u) => u.id);

      await ctx.db.transaction(async (tx) => {
        await tx
          .update(upload)
          .set({ deleted: true })
          .where(
            and(
              inArray(upload.id, uploadIds),
              eq(upload.tenantId, ctx.tenant.tenantId)
            )
          );

        if (input.deleteRelatedTransactions) {
          await tx
            .update(transaction)
            .set({ deleted: true })
            .where(
              and(
                inArray(transaction.uploadId, uploadIds),
                eq(transaction.tenantId, ctx.tenant.tenantId)
              )
            );
        }
      });

      return { deletedCount: uploadsToDelete.length };
    }),
  setPassword: protectedProcedure
    .input(
      z.object({
        uploadId: z.string().uuid(),
        password: z.string().min(1).max(1000),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { uploadId, password } = input;

      const [existingUpload] = await ctx.db
        .select({
          id: upload.id,
          status: upload.status,
          deleted: upload.deleted,
        })
        .from(upload)
        .where(
          and(eq(upload.id, uploadId), eq(upload.tenantId, ctx.tenant.tenantId))
        );

      if (!existingUpload || existingUpload.deleted) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Upload not found.",
        });
      }

      if (existingUpload.status !== "waiting_for_password") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Upload is not waiting for a password.",
        });
      }

      const encrypted = encryptPassword(password);

      await ctx.db
        .update(upload)
        .set({
          encryptedPassword: encrypted,
          status: "queued",
        })
        .where(
          and(eq(upload.id, uploadId), eq(upload.tenantId, ctx.tenant.tenantId))
        );

      await tasks.trigger("upload-breakdown", { uploadId });

      return { success: true };
    }),
  getLatestUploadDate: protectedProcedure.query(async ({ ctx }) => {
    const [latestUpload] = await ctx.db
      .select({
        createdAt: upload.createdAt,
      })
      .from(upload)
      .where(
        and(eq(upload.tenantId, ctx.tenant.tenantId), eq(upload.deleted, false))
      )
      .orderBy(desc(upload.createdAt))
      .limit(1);

    return {
      latestUploadDate: latestUpload?.createdAt ?? null,
    };
  }),
  createCsvUpload: protectedProcedure
    .input(
      z.object({
        fileName: z.string(),
        filePath: z.string(),
        fileSize: z.number().max(1024 * 1024, "CSV file must be under 1MiB"),
        cleanupFilePaths: z.array(z.string()).max(10).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const [newUpload] = await ctx.db
        .insert(upload)
        .values({
          tenantId: ctx.tenant.tenantId,
          fileName: input.fileName,
          filePath: input.filePath,
          fileSize: input.fileSize,
          fileType: "csv",
          status: "waiting_for_csv_answers",
        })
        .returning({ id: upload.id });

      if (input.cleanupFilePaths && input.cleanupFilePaths.length > 0) {
        const supabase = await createClient({ admin: true });
        await supabase.storage
          .from("bank-statements")
          .remove(input.cleanupFilePaths);
      }

      return { uploadId: newUpload.id };
    }),
  analyzeCsv: protectedProcedure
    .input(z.object({ uploadId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const [existingUpload] = await ctx.db
        .select({
          id: upload.id,
          filePath: upload.filePath,
          status: upload.status,
          metadata: upload.metadata,
          deleted: upload.deleted,
        })
        .from(upload)
        .where(
          and(
            eq(upload.id, input.uploadId),
            eq(upload.tenantId, ctx.tenant.tenantId)
          )
        );

      if (!existingUpload || existingUpload.deleted) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Upload not found.",
        });
      }

      if (existingUpload.status !== "waiting_for_csv_answers") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Upload is not waiting for CSV answers.",
        });
      }

      if (existingUpload.metadata?.csvConfig?.questions) {
        return {
          questions: existingUpload.metadata.csvConfig
            .questions as CsvQuestion[],
          preview: existingUpload.metadata.csvConfig.preview ?? {
            headers: [] as string[],
            sampleRows: [] as string[][],
          },
          inferredMapping: existingUpload.metadata.csvConfig.inferredMapping,
        };
      }

      const supabase = await createClient({ admin: true });
      const { data: fileData, error: downloadError } = await supabase.storage
        .from("bank-statements")
        .download(existingUpload.filePath);

      if (downloadError || !fileData) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to download CSV: ${downloadError?.message}`,
        });
      }

      const csvContent = await fileData.text();
      const { headers, rows } = parseCsvContent(csvContent, 50);

      if (headers.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "CSV file appears to be empty or invalid.",
        });
      }

      try {
        const analysisResult = await generateObject({
          model: "anthropic/claude-haiku-4.5",
          mode: "json",
          schemaName: "csv-analysis",
          schemaDescription:
            "Analysis result for a CSV bank statement with questions and column mapping.",
          schema: csvAnalysisResultSchema,
          messages: [
            {
              role: "user",
              content: buildCsvAnalysisPrompt(headers, rows),
            },
          ],
        });

        const questions = analysisResult.object.questions;
        const inferredMapping = analysisResult.object.inferredMapping;
        const preview = {
          headers,
          sampleRows: rows.slice(0, 5),
        };

        await ctx.db
          .update(upload)
          .set({
            metadata: {
              ...existingUpload.metadata,
              csvConfig: {
                questions,
                inferredMapping,
                preview,
              },
            },
          })
          .where(eq(upload.id, input.uploadId));

        return {
          questions,
          preview,
          inferredMapping,
        };
      } catch {
        await ctx.db
          .update(upload)
          .set({
            status: "failed",
            failedReason: "Failed to analyze CSV file. Please try again.",
          })
          .where(eq(upload.id, input.uploadId));

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to analyze CSV file. Please try again.",
        });
      }
    }),
  submitCsvAnswers: protectedProcedure
    .input(
      z.object({
        uploadId: z.string().uuid(),
        answers: z.record(z.string(), z.string()),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const [existingUpload] = await ctx.db
        .select({
          id: upload.id,
          status: upload.status,
          metadata: upload.metadata,
          deleted: upload.deleted,
        })
        .from(upload)
        .where(
          and(
            eq(upload.id, input.uploadId),
            eq(upload.tenantId, ctx.tenant.tenantId)
          )
        );

      if (!existingUpload || existingUpload.deleted) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Upload not found.",
        });
      }

      if (existingUpload.status !== "waiting_for_csv_answers") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Upload is not waiting for CSV answers.",
        });
      }

      const questions = existingUpload.metadata?.csvConfig?.questions ?? [];
      for (const question of questions) {
        if (question.required && !input.answers[question.id]?.trim()) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Required answer missing: ${question.label}`,
          });
        }
      }

      await ctx.db
        .update(upload)
        .set({
          status: "queued",
          metadata: {
            ...existingUpload.metadata,
            csvConfig: {
              ...existingUpload.metadata?.csvConfig,
              answers: input.answers,
            },
          },
        })
        .where(eq(upload.id, input.uploadId));

      await tasks.trigger("csv-breakdown", { uploadId: input.uploadId });

      return { success: true };
    }),
});
