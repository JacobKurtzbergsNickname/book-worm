import axios from "axios";
import type { Book, BookCreatePayload } from "../types";

const booksApi = axios.create({
  baseURL: "/api/books",
});

export async function getBooks(): Promise<Book[]> {
  const { data } = await booksApi.get<Book[]>("/");
  return data;
}

export async function getBookById(id: number): Promise<Book> {
  const { data } = await booksApi.get<Book>(`/${id}`);
  return data;
}

export async function createBook(payload: BookCreatePayload): Promise<Book> {
  const { data } = await booksApi.post<Book>("/", payload);
  return data;
}

export async function updateBook(id: number, payload: BookCreatePayload): Promise<Book> {
  const { data } = await booksApi.put<Book>(`/${id}`, payload);
  return data;
}

export async function deleteBook(id: number): Promise<Book> {
  const { data } = await booksApi.delete<Book>(`/${id}`);
  return data;
}
