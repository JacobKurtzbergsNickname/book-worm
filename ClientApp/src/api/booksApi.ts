import { ResultAsync } from "neverthrow";
import type { Book, BookCreatePayload } from "../models";

// ---------------------------------------------------------------------------
// Error type
// ---------------------------------------------------------------------------

export type AppError =
  | { readonly kind: "NotFound" }
  | { readonly kind: "Network"; readonly message: string }
  | { readonly kind: "Server"; readonly status: number }
  | { readonly kind: "Unknown"; readonly message: string };

export function formatAppError(err: AppError): string {
  switch (err.kind) {
    case "NotFound":  return "Not found.";
    case "Network":   return `Network error: ${err.message}`;
    case "Server":    return `Server error (${err.status}).`;
    case "Unknown":   return err.message;
  }
}

// ---------------------------------------------------------------------------
// Internal
// ---------------------------------------------------------------------------

const BASE_URL = "/api/books";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, init);
  if (res.status === 404) throw Object.assign(new Error("Not found"), { status: 404 });
  if (!res.ok) throw Object.assign(new Error("Server error"), { status: res.status });
  return res.json() as Promise<T>;
}

function toAppError(err: unknown): AppError {
  if (err instanceof Error) {
    const status = (err as Error & { status?: number }).status;
    if (status === 404) return { kind: "NotFound" };
    if (status !== undefined) return { kind: "Server", status };
    return { kind: "Network", message: err.message };
  }
  return { kind: "Unknown", message: String(err) };
}

function fromApi<T>(promise: Promise<T>): ResultAsync<T, AppError> {
  return ResultAsync.fromPromise(promise, toAppError);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function getBooks(): ResultAsync<readonly Book[], AppError> {
  return fromApi(apiFetch<Book[]>("/"));
}

export function getBookById(id: number): ResultAsync<Book, AppError> {
  return fromApi(apiFetch<Book>(`/${id}`));
}

export function createBook(payload: BookCreatePayload): ResultAsync<Book, AppError> {
  return fromApi(apiFetch<Book>("/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }));
}

export function updateBook(id: number, payload: BookCreatePayload): ResultAsync<Book, AppError> {
  return fromApi(apiFetch<Book>(`/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }));
}

export function deleteBook(id: number): ResultAsync<Book, AppError> {
  return fromApi(apiFetch<Book>(`/${id}`, { method: "DELETE" }));
}

// ---------------------------------------------------------------------------
// OpenLibrary
// ---------------------------------------------------------------------------

export type OpenLibraryBook = {
  readonly title?: string | null;
  readonly subtitle?: string | null;
  readonly publishers?: readonly string[] | null;
  readonly publishDate?: string | null;
  readonly numberOfPages?: number | null;
};

export function lookupBookByIsbn(isbn: string): ResultAsync<OpenLibraryBook, AppError> {
  return fromApi(apiFetch<OpenLibraryBook>(`/openlibrary/${encodeURIComponent(isbn)}`));
}
