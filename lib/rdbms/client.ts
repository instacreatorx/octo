import { Pool } from "pg";
import "dotenv/config";
import { getEffectivePostgresUrl } from "@/lib/services/settings";

let sharedPool: Pool | null = null;

export function getPostgresPool(): Pool {
  if (sharedPool) return sharedPool;
  const connectionString = process.env.POSTGRES_URL;
  if (!connectionString) {
    // Defer to async initializer path; however, for compatibility we throw if not set and not yet initialized.
    throw new Error("POSTGRES_URL environment variable is not set.");
  }
  sharedPool = new Pool({ connectionString });
  return sharedPool;
}

export async function withClient<T>(handler: (client: import("pg").PoolClient) => Promise<T>): Promise<T> {
  let pool = sharedPool;
  if (!pool) {
    const effective = await getEffectivePostgresUrl();
    sharedPool = new Pool({ connectionString: effective });
    pool = sharedPool;
  }
  const client = await pool.connect();
  try {
    const result = await handler(client);
    return result;
  } finally {
    client.release();
  }
}


