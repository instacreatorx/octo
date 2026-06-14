import { prisma } from "@/lib/db";
import { resetMssqlPool } from "@/lib/rdbms/mssql/client";

export interface SettingsDTO {
  openaiBaseUrl: string | null;
  postgresUrl: string | null;
  mssqlUrl: string | null;
  hasOpenaiApiKey: boolean;
}

// In-memory settings snapshot. Loaded once and kept fresh on updates.
let memorySettings: { openaiBaseUrl: string | null; openaiApiKey: string | null; postgresUrl: string | null; mssqlUrl: string | null } | null = null;
let initialized = false;

async function  ensureLoaded() {
  if (initialized && memorySettings) return;
  const row = await prisma.appSettings.findUnique({ where: { id: 1 } });
  memorySettings = {
    openaiBaseUrl: row?.openaiBaseUrl ?? null,
    openaiApiKey: row?.openaiApiKey ?? null,
    postgresUrl: row?.postgresUrl ?? null,
    mssqlUrl: row?.mssqlUrl ?? null,
  };
  initialized = true;
}

export async function getRawSettings() {
  await ensureLoaded();
  return memorySettings as NonNullable<typeof memorySettings>;
}

export async function getSettingsDTO(): Promise<SettingsDTO> {
  const raw = await getRawSettings();
  return {
    openaiBaseUrl: raw.openaiBaseUrl,
    postgresUrl: raw.postgresUrl,
    mssqlUrl: raw.mssqlUrl,
    hasOpenaiApiKey: !!(raw.openaiApiKey && raw.openaiApiKey.length > 0),
  };
}

export async function updateSettings(partial: { openaiBaseUrl?: string; openaiApiKey?: string; postgresUrl?: string; mssqlUrl?: string }) {
  const data: any = {};
  if (typeof partial.openaiBaseUrl !== 'undefined') data.openaiBaseUrl = nullableString(partial.openaiBaseUrl);
  if (typeof partial.openaiApiKey !== 'undefined') data.openaiApiKey = nullableString(partial.openaiApiKey);
  if (typeof partial.postgresUrl !== 'undefined') data.postgresUrl = nullableString(partial.postgresUrl);
  if (typeof partial.mssqlUrl !== 'undefined') data.mssqlUrl = nullableString(partial.mssqlUrl);

  const updated = await prisma.appSettings.upsert({
    where: { id: 1 },
    update: data,
    create: { id: 1, ...data },
  });
  memorySettings = {
    openaiBaseUrl: updated.openaiBaseUrl ?? null,
    openaiApiKey: updated.openaiApiKey ?? null,
    postgresUrl: updated.postgresUrl ?? null,
    mssqlUrl: updated.mssqlUrl ?? null,
  };
  initialized = true;
  
  // Invalidate MSSQL connection pool if MSSQL URL was updated
  if (typeof partial.mssqlUrl !== 'undefined') {
    resetMssqlPool();
  }
  
  return updated;
}

function nullableString(s: string | null | undefined): string | null {
  if (s === null || typeof s === 'undefined') return null;
  const t = String(s).trim();
  return t.length === 0 ? null : t;
}

export async function getEffectiveOpenAIConfig(): Promise<{ baseURL: string | undefined; apiKey: string | undefined }> {
  await ensureLoaded();
  const baseURL = (memorySettings?.openaiBaseUrl ?? null) ?? process.env.OPENAI_BASE_URL ?? undefined;
  const apiKey = (memorySettings?.openaiApiKey ?? null) ?? process.env.OPENAI_API_KEY ?? undefined;
  return { baseURL, apiKey };
}

export async function getEffectivePostgresUrl(): Promise<string> {
  await ensureLoaded();
  const url = (memorySettings?.postgresUrl ?? null) ?? process.env.POSTGRES_URL;
  if (!url) throw new Error("POSTGRES_URL not configured in settings or env");
  return url;
}

export async function getEffectiveMssqlUrl(): Promise<string> {
  await ensureLoaded();
  const url = (memorySettings?.mssqlUrl ?? null) ?? process.env.MSSQL_URL;
  if (!url) throw new Error("MSSQL_URL not configured in settings or env");
  return url;
}


