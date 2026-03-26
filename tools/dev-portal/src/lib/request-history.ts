export interface HistoryEntry {
  id: string;
  timestamp: string;
  serviceId: string;
  method: string;
  path: string;
  status?: number;
  elapsed?: number;
  headers?: Record<string, string>;
  queryParams?: Record<string, string>;
  body?: unknown;
}

const STORAGE_KEY = "busmate-dev-portal-history";
const MAX_ENTRIES = 100;

export function getHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addToHistory(entry: Omit<HistoryEntry, "id" | "timestamp">): HistoryEntry {
  const full: HistoryEntry = {
    ...entry,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
  };
  const history = getHistory();
  history.unshift(full);
  if (history.length > MAX_ENTRIES) history.length = MAX_ENTRIES;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  return full;
}

export function clearHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function removeFromHistory(id: string): void {
  const history = getHistory().filter((e) => e.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}
