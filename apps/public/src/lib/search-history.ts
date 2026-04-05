const STORAGE_KEY = 'toolcairn:search-history';
const MAX_HISTORY = 20;

export interface SearchHistoryEntry {
  id: string;
  query: string;
  timestamp: number;
  resultCount?: number;
}

export function getSearchHistory(): SearchHistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SearchHistoryEntry[];
  } catch {
    return [];
  }
}

export function addSearchHistory(query: string, resultCount?: number): void {
  if (typeof window === 'undefined') return;
  const trimmed = query.trim();
  if (!trimmed) return;

  const existing = getSearchHistory();
  // Remove duplicate if exists
  const filtered = existing.filter((e) => e.query.toLowerCase() !== trimmed.toLowerCase());
  const newEntry: SearchHistoryEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    query: trimmed,
    timestamp: Date.now(),
    resultCount,
  };
  const updated = [newEntry, ...filtered].slice(0, MAX_HISTORY);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // localStorage might be full or unavailable
  }
}

export function clearSearchHistory(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}
