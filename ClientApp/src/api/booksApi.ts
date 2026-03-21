import axios from "axios";
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

const booksApi = axios.create({ baseURL: "/api/books" });

function toAppError(err: unknown): AppError {
  if (axios.isAxiosError(err)) {
    if (err.response?.status === 404) return { kind: "NotFound" };
    if (err.response)                 return { kind: "Server", status: err.response.status };
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
  return fromApi(booksApi.get<Book[]>("/").then((r) => r.data));
}

export function getBookById(id: number): ResultAsync<Book, AppError> {
  return fromApi(booksApi.get<Book>(`/${id}`).then((r) => r.data));
}

export function createBook(payload: BookCreatePayload): ResultAsync<Book, AppError> {
  return fromApi(booksApi.post<Book>("/", payload).then((r) => r.data));
}

export function updateBook(id: number, payload: BookCreatePayload): ResultAsync<Book, AppError> {
  return fromApi(booksApi.put<Book>(`/${id}`, payload).then((r) => r.data));
}

export function deleteBook(id: number): ResultAsync<Book, AppError> {
  return fromApi(booksApi.delete<Book>(`/${id}`).then((r) => r.data));
}
