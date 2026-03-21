import { z } from "zod";
import type { Author } from "./author";

// ---------------------------------------------------------------------------
// Domain types
// ---------------------------------------------------------------------------

export type Book = {
  readonly id: number;
  readonly title: string;
  readonly isbn: string;
  readonly price: number;
  readonly description?: string | null;
  readonly publishedDate: string;
  readonly authorId?: number | null;
  readonly author?: Author | null;
  readonly genres?: readonly string[] | null;
};

export type BookCreatePayload = {
  readonly title: string;
  readonly isbn?: string;
  readonly price: number;
  readonly description?: string;
  readonly publishedDate?: string;
  readonly author?: Author;
  readonly genre?: readonly string[];
};

// ---------------------------------------------------------------------------
// Form schema
// All fields stored as strings in the form, Zod coerces on validation.
// ---------------------------------------------------------------------------

export const bookFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  isbn: z.string().default(""),
  price: z.coerce
    .number()
    .min(0, "Price must be at least 0"),
  publishedDate: z.string().default(""),
  description: z.string().default(""),
  authorFirstName: z.string().default(""),
  authorLastName: z.string().default(""),
  genresCsv: z.string().default(""),
});

export type BookFormValues = z.infer<typeof bookFormSchema>;

// Raw string-keyed form state before Zod parsing
export type BookFormRaw = {
  readonly title: string;
  readonly isbn: string;
  readonly price: string;
  readonly publishedDate: string;
  readonly description: string;
  readonly authorFirstName: string;
  readonly authorLastName: string;
  readonly genresCsv: string;
};
