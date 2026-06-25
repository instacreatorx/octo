export type ToolResultOk<T = unknown> = {
  status: "ok";
  msg?: string;
  data: T;
};

export type ToolResultFailed = {
  status: "failed";
  msg?: string;
  error: string;
};

export type ToolResult<T = unknown> = ToolResultOk<T> | ToolResultFailed;

export type NormalizedToolResult = {
  status: "ok" | "failed";
  msg?: string;
  error?: string;
  data?: unknown;
  raw: unknown;
};

export function toolOk<T>(data: T, msg?: string): ToolResultOk<T> {
  return { status: "ok", data, ...(msg ? { msg } : {}) };
}

export function toolFail(error: string, msg?: string): ToolResultFailed {
  return { status: "failed", error, ...(msg ? { msg } : {}) };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseToolResult(
  result: unknown,
  isError?: boolean,
): NormalizedToolResult {
  if (isError) {
    const message =
      typeof result === "string"
        ? result
        : isRecord(result) && typeof result.error === "string"
          ? result.error
          : JSON.stringify(result, null, 2);
    return { status: "failed", error: message, raw: result };
  }

  let value = result;
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      return { status: "ok", data: value, raw: result };
    }
  }

  if (isRecord(value)) {
    if (value.status === "ok") {
      return {
        status: "ok",
        msg: typeof value.msg === "string" ? value.msg : undefined,
        data: value.data,
        raw: result,
      };
    }
    if (value.status === "failed") {
      return {
        status: "failed",
        msg: typeof value.msg === "string" ? value.msg : undefined,
        error:
          typeof value.error === "string"
            ? value.error
            : JSON.stringify(value.error ?? value, null, 2),
        raw: result,
      };
    }
    if (typeof value.error === "string") {
      return {
        status: "failed",
        error: value.error,
        raw: result,
      };
    }
    if ("success" in value && value.success === false) {
      return {
        status: "failed",
        error:
          typeof value.error === "string"
            ? value.error
            : typeof value.message === "string"
              ? value.message
              : JSON.stringify(value, null, 2),
        raw: result,
      };
    }
    return { status: "ok", data: value, raw: result };
  }

  return { status: "ok", data: value, raw: result };
}

export function extractToolData(result: unknown): unknown {
  const normalized = parseToolResult(result);
  return normalized.status === "ok" ? normalized.data : undefined;
}
