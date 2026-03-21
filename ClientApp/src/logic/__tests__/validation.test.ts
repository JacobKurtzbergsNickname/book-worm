import { describe, it, expect } from "vitest";
import { bookFormSchema } from "../../models";

// ---------------------------------------------------------------------------
// bookFormSchema
// ---------------------------------------------------------------------------

const validInput = { title: "My Book", price: 9.99 };

describe("bookFormSchema – valid input", () => {
  it("accepts minimal valid input", () => {
    const result = bookFormSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("defaults isbn to empty string", () => {
    const result = bookFormSchema.safeParse(validInput);
    expect(result.success && result.data.isbn).toBe("");
  });

  it("defaults description to empty string", () => {
    const result = bookFormSchema.safeParse(validInput);
    expect(result.success && result.data.description).toBe("");
  });

  it("defaults authorFirstName to empty string", () => {
    const result = bookFormSchema.safeParse(validInput);
    expect(result.success && result.data.authorFirstName).toBe("");
  });

  it("defaults authorLastName to empty string", () => {
    const result = bookFormSchema.safeParse(validInput);
    expect(result.success && result.data.authorLastName).toBe("");
  });

  it("defaults genresCsv to empty string", () => {
    const result = bookFormSchema.safeParse(validInput);
    expect(result.success && result.data.genresCsv).toBe("");
  });

  it("defaults publishedDate to empty string", () => {
    const result = bookFormSchema.safeParse(validInput);
    expect(result.success && result.data.publishedDate).toBe("");
  });

  it("coerces price from numeric string", () => {
    const result = bookFormSchema.safeParse({ ...validInput, price: "19.99" });
    expect(result.success && result.data.price).toBe(19.99);
  });

  it("accepts zero price", () => {
    const result = bookFormSchema.safeParse({ ...validInput, price: 0 });
    expect(result.success).toBe(true);
  });
});

describe("bookFormSchema – invalid input", () => {
  it("rejects empty title", () => {
    const result = bookFormSchema.safeParse({ ...validInput, title: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const titleIssue = result.error.issues.find((i) => i.path[0] === "title");
      expect(titleIssue?.message).toBe("Title is required");
    }
  });

  it("rejects missing title", () => {
    const { title: _t, ...rest } = validInput;
    const result = bookFormSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects negative price", () => {
    const result = bookFormSchema.safeParse({ ...validInput, price: -1 });
    expect(result.success).toBe(false);
    if (!result.success) {
      const priceIssue = result.error.issues.find((i) => i.path[0] === "price");
      expect(priceIssue?.message).toBe("Price must be at least 0");
    }
  });

  it("rejects non-numeric price string (coerces to NaN which fails min check)", () => {
    const result = bookFormSchema.safeParse({ ...validInput, price: "abc" });
    expect(result.success).toBe(false);
  });
});
