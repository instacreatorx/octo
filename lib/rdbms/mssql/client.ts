import sql from "mssql";
import "dotenv/config";
import { getEffectiveMssqlUrl } from "@/lib/services/settings";

let sharedPool: sql.ConnectionPool | null = null;
let currentConnectionUrl: string | null = null;

function parseMssqlUrl(url: string): sql.config {
  // Parse URL format: mssql://user:password@host:port/database?options
  const urlObj = new URL(url);
  
  const config: any = {
    server: urlObj.hostname,
    user: urlObj.username,
    password: urlObj.password,
  };

  // Parse database from pathname (remove leading '/')
  const database = urlObj.pathname.slice(1);
  if (database) {
    config.database = database;
  }

  // Add port if specified
  if (urlObj.port) {
    config.port = parseInt(urlObj.port, 10);
  }

  // Parse query parameters into options object
  const options: any = {};
  urlObj.searchParams.forEach((value, key) => {
    // Convert string booleans to actual booleans
    if (value === 'true') {
      options[key] = true;
    } else if (value === 'false') {
      options[key] = false;
    } else if (!isNaN(Number(value)) && value !== '') {
      options[key] = Number(value);
    } else {
      options[key] = value;
    }
  });

  // Add options object if there are any options
  if (Object.keys(options).length > 0) {
    config.options = options;
  }

  return config as sql.config;
}

function createConnectionPool(connectionString: string): sql.ConnectionPool {
  // Check if it's a URL format (mssql://...)
  if (connectionString.startsWith('mssql://')) {
    try {
      const config = parseMssqlUrl(connectionString);
      return new sql.ConnectionPool(config);
    } catch (error) {
      throw new Error(`Failed to parse MSSQL URL: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Check if it's a JSON config object
  try {
    const config = JSON.parse(connectionString);
    // Validate it's an object with expected properties
    if (typeof config === 'object' && config !== null) {
      return new sql.ConnectionPool(config);
    }
  } catch {
    // If not JSON, treat as standard connection string
    // Connection string format: "Server=...;Database=...;User Id=...;Password=...;"
    return new sql.ConnectionPool(connectionString);
  }
  // Fallback to connection string if JSON parse succeeded but wasn't an object
  return new sql.ConnectionPool(connectionString);
}

export function resetMssqlPool() {
  if (sharedPool) {
    // Close the existing pool asynchronously (don't wait)
    sharedPool.close().catch(() => {
      // Ignore errors when closing
    });
    sharedPool = null;
  }
  currentConnectionUrl = null;
}

export async function withClient<T>(handler: (client: sql.Request) => Promise<T>): Promise<T> {
  // Always get the effective URL from settings (which checks database settings first, then env)
  let effective: string;
  try {
    effective = await getEffectiveMssqlUrl();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to get MSSQL connection URL: ${errorMessage}`);
  }

  // Check if we need to recreate the pool (URL changed or pool doesn't exist)
  if (!sharedPool || currentConnectionUrl !== effective) {
    // Close old pool if it exists and URL changed
    if (sharedPool && currentConnectionUrl !== effective) {
      try {
        await sharedPool.close();
      } catch {
        // Ignore errors when closing old pool
      }
    }
    
    // Create new pool with the effective URL
    sharedPool = createConnectionPool(effective);
    currentConnectionUrl = effective;
  }
  
  const pool = sharedPool;
  
  // Ensure connection is established
  try {
    if (!pool.connected && !pool.connecting) {
      await pool.connect();
    }
    // Wait for connection if it's still connecting
    if (pool.connecting) {
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("MSSQL connection timeout"));
        }, 10000);
        
        const checkConnection = () => {
          if (pool.connected) {
            clearTimeout(timeout);
            resolve();
          } else if (!pool.connecting) {
            clearTimeout(timeout);
            reject(new Error("MSSQL connection failed"));
          } else {
            setTimeout(checkConnection, 100);
          }
        };
        checkConnection();
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to connect to MSSQL database: ${errorMessage}. Please check your MSSQL_URL connection string.`);
  }
  
  const request = pool.request();
  try {
    const result = await handler(request);
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`MSSQL query execution failed: ${errorMessage}`);
  }
}

