import { test, expect } from "@playwright/test";

// ---------------------------------------------------------------------------
// Shared mock helpers
// ---------------------------------------------------------------------------

type MockBook = {
  id: number;
  title: string;
  isbn: string;
  price: number;
  description: string;
  publishedDate: string;
  author: { firstName: string; lastName: string } | null;
  genres: string[];
};

function setupApiMock(page: Parameters<typeof test>[1] extends (args: { page: infer P }) => unknown ? P : never, books: MockBook[]) {
  return page.route("**/api/books*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const parts = url.pathname.split("/").filter(Boolean);
    const id = Number(parts[parts.length - 1]);

    if (request.method() === "GET" && url.pathname === "/api/books/") {
      await route.fulfill({ json: books });
      return;
    }

    if (request.method() === "POST" && url.pathname === "/api/books/") {
      const payload = request.postDataJSON() as Record<string, unknown>;
      const created: MockBook = {
        id:            books.length + 1,
        title:         String(payload.title),
        isbn:          String(payload.isbn ?? ""),
        price:         Number(payload.price),
        description:   String(payload.description ?? ""),
        publishedDate: String(payload.publishedDate ?? "2024-01-01T00:00:00"),
        author:        (payload.author as MockBook["author"]) ?? null,
        genres:        (payload.genre as string[]) ?? [],
      };
      books.push(created);
      await route.fulfill({ status: 201, json: created });
      return;
    }

    if (request.method() === "GET" && url.pathname.startsWith("/api/books/")) {
      const found = books.find((b) => b.id === id);
      await route.fulfill(found ? { json: found } : { status: 404 });
      return;
    }

    if (request.method() === "PUT" && url.pathname.startsWith("/api/books/")) {
      const payload = request.postDataJSON() as Record<string, unknown>;
      const index = books.findIndex((b) => b.id === id);
      if (index === -1) { await route.fulfill({ status: 404 }); return; }
      books[index] = {
        ...books[index]!,
        title:         String(payload.title),
        isbn:          String(payload.isbn ?? ""),
        price:         Number(payload.price),
        description:   String(payload.description ?? ""),
        publishedDate: String(payload.publishedDate ?? books[index]!.publishedDate),
        author:        (payload.author as MockBook["author"]) ?? null,
        genres:        (payload.genre as string[]) ?? [],
      };
      await route.fulfill({ json: books[index] });
      return;
    }

    if (request.method() === "DELETE" && url.pathname.startsWith("/api/books/")) {
      const index = books.findIndex((b) => b.id === id);
      if (index === -1) { await route.fulfill({ status: 404 }); return; }
      const deleted = books.splice(index, 1)[0];
      await route.fulfill({ json: deleted });
      return;
    }

    await route.fallback();
  });
}

function seedBooks(): MockBook[] {
  return [
    {
      id:            1,
      title:         "Existing Book",
      isbn:          "123",
      price:         10,
      description:   "Seed book",
      publishedDate: "2024-01-01T00:00:00",
      author:        { firstName: "Seed", lastName: "Author" },
      genres:        ["Fiction"],
    },
  ];
}

// ---------------------------------------------------------------------------
// CRUD happy path
// ---------------------------------------------------------------------------

test("list, create, view, update, and delete a book", async ({ page }) => {
  const books = seedBooks();
  await setupApiMock(page, books);

  // List
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "All Books" })).toBeVisible();
  await expect(page.getByText("Existing Book")).toBeVisible();

  // Create
  await page.getByLabel("Title").fill("New Book");
  await page.getByLabel("ISBN").fill("999-1");
  await page.getByLabel("Price").fill("29.99");
  await page.getByLabel("Description").fill("Created in test");
  await page.getByLabel("Author First Name").fill("Nina");
  await page.getByLabel("Author Last Name").fill("Writer");
  await page.getByLabel("Genres").fill("Drama, Test");
  await page.getByRole("button", { name: "Create Book" }).click();

  await expect(page.getByText("New Book")).toBeVisible();

  // View / Read
  await page.getByRole("link", { name: "View" }).last().click();
  await expect(page.getByRole("heading", { name: /Book: New Book/ })).toBeVisible();

  // Update
  await page.getByLabel("Title").fill("Updated Book");
  await page.getByLabel("Price").fill("31.50");
  await page.getByRole("button", { name: "Update Book" }).click();

  await expect(page.getByRole("heading", { name: /Book: Updated Book/ })).toBeVisible();

  // Delete
  await page.getByRole("button", { name: "Delete Book" }).click();
  await expect(page).toHaveURL("/");
  await expect(page.getByText("Updated Book")).not.toBeVisible();
});

// ---------------------------------------------------------------------------
// Form validation
// ---------------------------------------------------------------------------

test("shows validation error when title is empty", async ({ page }) => {
  const books = seedBooks();
  await setupApiMock(page, books);

  await page.goto("/");
  await page.getByLabel("Price").fill("9.99");
  // Leave title empty and submit
  await page.getByRole("button", { name: "Create Book" }).click();

  await expect(page.getByText("Title is required")).toBeVisible();
  // No book was added
  await expect(page.getByText("New Book")).not.toBeVisible();
});

test("shows validation error when price is negative", async ({ page }) => {
  const books = seedBooks();
  await setupApiMock(page, books);

  await page.goto("/");
  await page.getByLabel("Title").fill("Bad Book");
  await page.getByLabel("Price").fill("-5");
  await page.getByRole("button", { name: "Create Book" }).click();

  await expect(page.getByText("Price must be at least 0")).toBeVisible();
});

test("clears validation errors when field is corrected", async ({ page }) => {
  const books = seedBooks();
  await setupApiMock(page, books);

  await page.goto("/");
  // Submit with empty title to trigger error
  await page.getByLabel("Price").fill("5.00");
  await page.getByRole("button", { name: "Create Book" }).click();
  await expect(page.getByText("Title is required")).toBeVisible();

  // Fix the title — error should disappear
  await page.getByLabel("Title").fill("Fixed Book");
  await expect(page.getByText("Title is required")).not.toBeVisible();
});

// ---------------------------------------------------------------------------
// Error state: book not found
// ---------------------------------------------------------------------------

test("shows error when navigating to non-existent book", async ({ page }) => {
  const books: MockBook[] = [];
  await setupApiMock(page, books);

  await page.goto("/books/999");
  await expect(page.getByRole("alert")).toBeVisible();
});
