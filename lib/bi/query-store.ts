// Temporary storage for current request's query data (for tool execution)
// This is request-scoped and only exists during a single API request
let currentRequestQueryData: any[] | null = null;
let currentRequestUserId: string | null = null;

// For current request context
export function setCurrentRequestQueryData(data: any[]): void {
  currentRequestQueryData = data;
}

export function getStoredQueryData(): any[] | null {
  return currentRequestQueryData;
}

export function clearCurrentRequestQueryData(): void {
  currentRequestQueryData = null;
  currentRequestUserId = null;
}

export function setCurrentRequestUserId(userId: string): void {
  currentRequestUserId = userId;
}

export function getCurrentRequestUserId(): string | null {
  return currentRequestUserId;
}

