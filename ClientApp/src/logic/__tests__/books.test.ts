import { describe, it, expect } from "vitest";
import {
  toDateInput,
  parseGenres,
  bookToFormRaw,
  emptyFormRaw,
  buildPayload,
} from "../books";
import type { Book } from "../../models";

// ---------------------------------------------------------------------------
// toDateInput
// ---------------------------------------------------------------------------

describe("toDateInput", () => {
  it("returns empty string for undefined", () => {
    expect(toDateInput(undefined)).toBe("");
  });

  it("returns empty string for null", () => {
    expect(toDateInput(null)).toBe("");
  });

  it("returns empty string for empty string", () => {
    expect(toDateInput("")).toBe("");
  });

  it("strips time component from ISO 8601 datetime", () => {
    expect(toDateInput("2024-01-15T00:00:00")).toBe("2024-01-15");
  });

  it("returns date-only string unchanged", () => {
    expect(toDateInput("2024-01-15")).toBe("2024-01-15");
  });

  it("strips milliseconds and timezone suffix", () => {
    expect(toDateInput("2024-06-01T12:34:56.789Z")).toBe("2024-06-01");
  });
});

// ---------------------------------------------------------------------------
// parseGenres
// ---------------------------------------------------------------------------

describe("parseGenres", () => {
  it("returns empty array for empty string", () => {
    expect(parseGenres("")).toEqual([]);
  });

  it("parses a single genre", () => {
    expect(parseGenres("Fiction")).toEqual(["Fiction"]);
  });

  it("parses multiple comma-separated genres", () => {
    expect(parseGenres("Fiction, Drama")).toEqual(["Fiction", "Drama"]);
  });

  it("trims surrounding whitespace from each genre", () => {
    expect(parseGenres("  Fantasy  ,  Romance  ")).toEqual(["Fantasy", "Romance"]);
  });

  it("filters out empty entries caused by consecutive commas", () => {
    expect(parseGenres("Fiction,,Drama")).toEqual(["Fiction", "Drama"]);
  });

  it("filters out whitespace-only entries", () => {
    expect(parseGenres("Fiction,   ,Drama")).toEqual(["Fiction", "Drama"]);
  });
});

// ---------------------------------------------------------------------------
// bookToFormRaw
// ---------------------------------------------------------------------------

const fullBook: Book = {
  id:            1,
  title:         "Dune",
  isbn:          "978-0441013593",
  price:         14.99,
  description:   "A sci-fi classic",
  publishedDate: "1965-08-01T00:00:00",
  author:        { firstName: "Frank", lastName: "Herbert" },
  genres:        ["Sci-Fi", "Adventure"],
};

describe("bookToFormRaw", () => {
  it("maps title", () => {
    expect(bookToFormRaw(fullBook).title).toBe("Dune");
  });

  it("maps isbn", () => {
    expect(bookToFormRaw(fullBook).isbn).toBe("978-0441013593");
  });

  it("converts price to string", () => {
    expect(bookToFormRaw(fullBook).price).toBe("14.99");
  });

  it("converts ISO date to date-input format", () => {
    expect(bookToFormRaw(fullBook).publishedDate).toBe("1965-08-01");
  });

  it("maps description", () => {
    expect(bookToFormRaw(fullBook).description).toBe("A sci-fi classic");
  });

  it("maps author first name", () => {
    expect(bookToFormRaw(fullBook).authorFirstName).toBe("Frank");
  });

  it("maps author last name", () => {
    expect(bookToFormRaw(fullBook).authorLastName).toBe("Herbert");
  });

  it("joins genres into CSV", () => {
    expect(bookToFormRaw(fullBook).genresCsv).toBe("Sci-Fi, Adventure");
  });

  it("uses empty strings for missing optional fields", () => {
    const sparse: Book = { id: 2, title: "Sparse", isbn: "", price: 5, publishedDate: "" };
    const raw = bookToFormRaw(sparse);
    expect(raw.description).toBe("");
    expect(raw.authorFirstName).toBe("");
    expect(raw.authorLastName).toBe("");
    expect(raw.genresCsv).toBe("");
  });
});

// ---------------------------------------------------------------------------
// emptyFormRaw
// ---------------------------------------------------------------------------

describe("emptyFormRaw", () => {
  it("returns all string fields", () => {
    const raw = emptyFormRaw();
    expect(Object.values(raw).every((v) => typeof v === "string")).toBe(true);
  });

  it("initialises price to '0'", () => {
    expect(emptyFormRaw().price).toBe("0");
  });

  it("initialises title to empty string", () => {
    expect(emptyFormRaw().title).toBe("");
  });
});

// ---------------------------------------------------------------------------
// buildPayload
// ---------------------------------------------------------------------------

const baseValues = {
  title:           "My Book",
  isbn:            "123",
  price:           9.99,
  publishedDate:   "",
  description:     "",
  authorFirstName: "",
  authorLastName:  "",
  genresCsv:       "",
};

describe("buildPayload", () => {
  it("copies title and price", () => {
    const p = buildPayload(baseValues);
    expect(p.title).toBe("My Book");
    expect(p.price).toBe(9.99);
  });

  it("omits publishedDate when empty", () => {
    expect(buildPayload(baseValues).publishedDate).toBeUndefined();
  });

  it("includes publishedDate when provided", () => {
    const p = buildPayload({ ...baseValues, publishedDate: "2024-01-15" });
    expect(p.publishedDate).toBe("2024-01-15");
  });

  it("omits author when both names are empty", () => {
    expect(buildPayload(baseValues).author).toBeUndefined();
  });

  it("omits author when only first name is provided", () => {
    const p = buildPayload({ ...baseValues, authorFirstName: "Jane" });
    expect(p.author).toBeUndefined();
  });

  it("omits author when only last name is provided", () => {
    const p = buildPayload({ ...baseValues, authorLastName: "Doe" });
    expect(p.author).toBeUndefined();
  });

  it("includes author when both names are provided", () => {
    const p = buildPayload({ ...baseValues, authorFirstName: "Jane", authorLastName: "Doe" });
    expect(p.author).toEqual({ firstName: "Jane", lastName: "Doe" });
  });

  it("parses genresCsv into an array", () => {
    const p = buildPayload({ ...baseValues, genresCsv: "Horror, Thriller" });
    expect(p.genre).toEqual(["Horror", "Thriller"]);
  });

  it("returns empty genre array when genresCsv is empty", () => {
    expect(buildPayload(baseValues).genre).toEqual([]);
  });
});
