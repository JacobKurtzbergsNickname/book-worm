import { useEffect, useReducer } from "react";
import { createBook, formatAppError, getBooks, type AppError } from "../api";
import { BookForm } from "../components";
import { buildPayload } from "../logic";
import type { Book, BookFormValues } from "../models";
import { navigateTo } from "../routing";

// ---------------------------------------------------------------------------
// Model & Msg  (ELM-style)
// ---------------------------------------------------------------------------

type Model =
  | { readonly status: "loading" }
  | { readonly status: "ready"; readonly books: readonly Book[] }
  | { readonly status: "error"; readonly message: string };

type Msg =
  | { readonly type: "BooksLoaded";  readonly books: readonly Book[] }
  | { readonly type: "LoadFailed";   readonly error: AppError }
  | { readonly type: "BookCreated";  readonly book: Book }
  | { readonly type: "CreateFailed"; readonly error: AppError };

// ---------------------------------------------------------------------------
// Update (pure reducer)
// ---------------------------------------------------------------------------

function update(model: Model, msg: Msg): Model {
  switch (msg.type) {
    case "BooksLoaded":
      return { status: "ready", books: msg.books };

    case "LoadFailed":
      return { status: "error", message: formatAppError(msg.error) };

    case "BookCreated":
      if (model.status !== "ready") return model;
      return { ...model, books: [...model.books, msg.book] };

    case "CreateFailed":
      // The form already shows API errors; keep current book list intact.
      return model;
  }
}

const initialModel: Model = { status: "loading" };

// ---------------------------------------------------------------------------
// View
// ---------------------------------------------------------------------------

export default function BooksPage() {
  const [model, dispatch] = useReducer(update, initialModel);

  useEffect(() => {
    void getBooks().match(
      (books) => dispatch({ type: "BooksLoaded", books }),
      (error)  => dispatch({ type: "LoadFailed", error }),
    );
  }, []);

  async function handleCreate(values: BookFormValues): Promise<void> {
    await createBook(buildPayload(values)).match(
      (book)  => dispatch({ type: "BookCreated", book }),
      (error) => dispatch({ type: "CreateFailed", error }),
    );
  }

  if (model.status === "loading") {
    return <p className="p-5">Loading...</p>;
  }

  if (model.status === "error") {
    return <p role="alert" className="p-5">{model.message}</p>;
  }

  return (
    <main className="mx-auto max-w-5xl p-5 grid gap-8">
      <section>
        <h2 className="text-2xl mb-3">All Books</h2>
        <ul className="grid gap-2" aria-label="Book list">
          {model.books.map((book) => (
            <li key={book.id} className="border rounded p-3 flex justify-between">
              <div>
                <p className="font-bold">{book.title}</p>
                <p>${book.price.toFixed(2)}</p>
              </div>
              <a
                className="text-blue-300 underline"
                href={`/books/${book.id}`}
                onClick={(event) => {
                  event.preventDefault();
                  navigateTo(`/books/${book.id}`);
                }}
              >
                View
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-2xl mb-3">Add Book</h2>
        <BookForm submitText="Create Book" onSubmit={handleCreate} />
      </section>
    </main>
  );
}
