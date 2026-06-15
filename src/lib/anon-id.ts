/**
 * Anonymous identity for ratings and stars.
 * Generates a random UUID on first visit and persists it in localStorage.
 */

const STORAGE_KEY = "agentdock-anon-id";

export function getAnonId(): string {
  if (typeof window === "undefined") return "server";

  let id = localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}
