import type { Book, BookCreatePayload, BookFormRaw, BookFormValues } from "../models";

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

/** Strips the time component from an ISO 8601 string for use in <input type="date">. */
export function toDateInput(value: string | null | undefined): string {
  if (!value) return "";
  return value.split("T")[0] ?? "";
}

// ---------------------------------------------------------------------------
// Genre helpers
// ---------------------------------------------------------------------------

/** Parses a comma-separated genre string into a trimmed, non-empty string array. */
export function parseGenres(csv: string): readonly string[] {
  return csv
    .split(",")
    .map((g) => g.trim())
    .filter(Boolean);
}

// ---------------------------------------------------------------------------
// Form ↔ domain conversions
// ---------------------------------------------------------------------------

/** Builds the raw string form state from an existing Book (for edit mode). */
export function bookToFormRaw(book: Book): BookFormRaw {
  return {
    title:           book.title,
    isbn:            book.isbn ?? "",
    price:           book.price.toString(),
    publishedDate:   toDateInput(book.publishedDate),
    description:     book.description ?? "",
    authorFirstName: book.author?.firstName ?? "",
    authorLastName:  book.author?.lastName ?? "",
    genresCsv:       book.genres?.join(", ") ?? "",
  };
}

/** Returns the empty initial raw form state. */
export function emptyFormRaw(): BookFormRaw {
  return {
    title: "", isbn: "", price: "0",
    publishedDate: "", description: "",
    authorFirstName: "", authorLastName: "", genresCsv: "",
  };
}

/** Converts validated BookFormValues into the API payload shape. */
export function buildPayload(values: BookFormValues): BookCreatePayload {
  const hasAuthor = values.authorFirstName !== "" && values.authorLastName !== "";

  return {
    title:         values.title,
    isbn:          values.isbn,
    price:         values.price,
    description:   values.description,
    publishedDate: values.publishedDate || undefined,
    genre:         parseGenres(values.genresCsv),
    author:        hasAuthor
      ? { firstName: values.authorFirstName, lastName: values.authorLastName }
      : undefined,
  };
}
