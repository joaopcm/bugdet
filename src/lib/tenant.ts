import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { userTenant } from "@/db/schema";
import {
  decryptWithKEK,
  encryptWithKEK,
  generateDEK,
  hashWithKEK,
} from "@/lib/crypto";

export interface TenantContext {
  tenantId: string;
  dek: string;
}

export async function getOrCreateTenant(
  userId: string
): Promise<TenantContext> {
  const userIdHash = hashWithKEK(userId);

  const [existing] = await db
    .select({
      tenantId: userTenant.tenantId,
      dekEncrypted: userTenant.dekEncrypted,
    })
    .from(userTenant)
    .where(eq(userTenant.userIdHash, userIdHash))
    .limit(1);

  if (existing) {
    return {
      tenantId: existing.tenantId,
      dek: decryptWithKEK(existing.dekEncrypted),
    };
  }

  const tenantId = randomUUID();
  const dek = generateDEK();
  const dekEncrypted = encryptWithKEK(dek);

  await db
    .insert(userTenant)
    .values({
      tenantId,
      userIdHash,
      userIdEncrypted: encryptWithKEK(userId),
      dekEncrypted,
    })
    .onConflictDoNothing({ target: userTenant.userIdHash });

  const [tenant] = await db
    .select({
      tenantId: userTenant.tenantId,
      dekEncrypted: userTenant.dekEncrypted,
    })
    .from(userTenant)
    .where(eq(userTenant.userIdHash, userIdHash))
    .limit(1);

  if (!tenant) {
    throw new Error("Failed to create or retrieve tenant");
  }

  return {
    tenantId: tenant.tenantId,
    dek: decryptWithKEK(tenant.dekEncrypted),
  };
}

export async function resolveTenantFromUserId(
  userId: string
): Promise<TenantContext | null> {
  const userIdHash = hashWithKEK(userId);

  const [tenant] = await db
    .select({
      tenantId: userTenant.tenantId,
      dekEncrypted: userTenant.dekEncrypted,
    })
    .from(userTenant)
    .where(eq(userTenant.userIdHash, userIdHash))
    .limit(1);

  if (!tenant) {
    return null;
  }

  return {
    tenantId: tenant.tenantId,
    dek: decryptWithKEK(tenant.dekEncrypted),
  };
}

export async function getUserIdFromTenant(
  tenantId: string
): Promise<string | null> {
  const [tenant] = await db
    .select({
      userIdEncrypted: userTenant.userIdEncrypted,
    })
    .from(userTenant)
    .where(eq(userTenant.tenantId, tenantId))
    .limit(1);

  if (!tenant) {
    return null;
  }

  return decryptWithKEK(tenant.userIdEncrypted);
}
