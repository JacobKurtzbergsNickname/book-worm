import { type FormEvent, useMemo, useState } from "react";
import type { Book, BookCreatePayload } from "../types";

type BookFormProps = {
  initialBook?: Book;
  onSubmit: (payload: BookCreatePayload) => Promise<void>;
  submitText: string;
};

function toDateInput(value?: string): string {
  if (!value) return "";
  return value.split("T")[0] ?? "";
}

export default function BookForm({ initialBook, onSubmit, submitText }: BookFormProps) {
  const [title, setTitle] = useState(initialBook?.title ?? "");
  const [isbn, setIsbn] = useState(initialBook?.isbn ?? "");
  const [price, setPrice] = useState(initialBook?.price.toString() ?? "0");
  const [description, setDescription] = useState(initialBook?.description ?? "");
  const [publishedDate, setPublishedDate] = useState(toDateInput(initialBook?.publishedDate));
  const [authorFirstName, setAuthorFirstName] = useState(initialBook?.author?.firstName ?? "");
  const [authorLastName, setAuthorLastName] = useState(initialBook?.author?.lastName ?? "");
  const [genresCsv, setGenresCsv] = useState(initialBook?.genres?.join(", ") ?? "");
  const [isSaving, setIsSaving] = useState(false);

  const parsedGenres = useMemo(
    () => genresCsv.split(",").map((g) => g.trim()).filter(Boolean),
    [genresCsv],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);

    const payload: BookCreatePayload = {
      title,
      isbn,
      price: Number(price),
      description,
      publishedDate: publishedDate || undefined,
      genre: parsedGenres,
      author: authorFirstName && authorLastName ? {
        firstName: authorFirstName,
        lastName: authorLastName,
      } : undefined,
    };

    await onSubmit(payload);
    setIsSaving(false);
  }

  return (
    <form className="grid gap-3" onSubmit={handleSubmit}>
      <input aria-label="Title" className="border rounded p-2" value={title} onChange={(e) => setTitle(e.target.value)} required />
      <input aria-label="ISBN" className="border rounded p-2" value={isbn} onChange={(e) => setIsbn(e.target.value)} />
      <input aria-label="Price" className="border rounded p-2" type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required />
      <input aria-label="Published Date" className="border rounded p-2" type="date" value={publishedDate} onChange={(e) => setPublishedDate(e.target.value)} />
      <textarea aria-label="Description" className="border rounded p-2" value={description} onChange={(e) => setDescription(e.target.value)} />
      <input aria-label="Author First Name" className="border rounded p-2" value={authorFirstName} onChange={(e) => setAuthorFirstName(e.target.value)} />
      <input aria-label="Author Last Name" className="border rounded p-2" value={authorLastName} onChange={(e) => setAuthorLastName(e.target.value)} />
      <input aria-label="Genres" className="border rounded p-2" value={genresCsv} onChange={(e) => setGenresCsv(e.target.value)} placeholder="fantasy, fiction" />
      <button className="bg-blue-600 px-4 py-2 rounded" type="submit" disabled={isSaving}>{isSaving ? "Saving..." : submitText}</button>
    </form>
  );
}
