import { useEffect, useReducer } from "react";
import { deleteBook, formatAppError, getBookById, updateBook, type AppError } from "../api";
import { BookForm } from "../components";
import { buildPayload } from "../logic";
import type { Book, BookFormValues } from "../models";
import { navigateTo } from "../routing";

// ---------------------------------------------------------------------------
// Model & Msg  (ELM-style)
// ---------------------------------------------------------------------------

type Model =
  | { readonly status: "loading" }
  | { readonly status: "ready"; readonly book: Book }
  | { readonly status: "error"; readonly message: string };

type Msg =
  | { readonly type: "BookLoaded";   readonly book: Book }
  | { readonly type: "LoadFailed";   readonly error: AppError }
  | { readonly type: "BookUpdated";  readonly book: Book }
  | { readonly type: "UpdateFailed"; readonly error: AppError };

// ---------------------------------------------------------------------------
// Update (pure reducer)
// ---------------------------------------------------------------------------

function update(model: Model, msg: Msg): Model {
  switch (msg.type) {
    case "BookLoaded":
      return { status: "ready", book: msg.book };

    case "LoadFailed":
      return { status: "error", message: formatAppError(msg.error) };

    case "BookUpdated":
      return { status: "ready", book: msg.book };

    case "UpdateFailed":
      // The form displays its own saving state; keep current book visible.
      return model;
  }
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type BookDetailPageProps = {
  readonly id: string;
};

// ---------------------------------------------------------------------------
// View
// ---------------------------------------------------------------------------

export default function BookDetailPage({ id }: BookDetailPageProps) {
  const [model, dispatch] = useReducer(update, { status: "loading" });

  const bookId = Number(id);

  useEffect(() => {
    void getBookById(bookId).match(
      (book)  => dispatch({ type: "BookLoaded", book }),
      (error) => dispatch({ type: "LoadFailed", error }),
    );
  }, [bookId]);

  async function handleUpdate(values: BookFormValues): Promise<void> {
    await updateBook(bookId, buildPayload(values)).match(
      (book)  => dispatch({ type: "BookUpdated", book }),
      (error) => dispatch({ type: "UpdateFailed", error }),
    );
  }

  async function handleDelete(): Promise<void> {
    await deleteBook(bookId).match(
      () => navigateTo("/"),
      () => navigateTo("/"),  // navigate home regardless
    );
  }

  const backLink = (
    <a
      className="underline"
      href="/"
      onClick={(event) => {
        event.preventDefault();
        navigateTo("/");
      }}
    >
      Back
    </a>
  );

  if (model.status === "loading") {
    return <p className="p-5">Loading...</p>;
  }

  if (model.status === "error") {
    return (
      <main className="p-5 grid gap-3">
        <p role="alert">{model.message}</p>
        {backLink}
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl p-5 grid gap-5">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl">Book: {model.book.title}</h2>
        <a
          className="underline"
          href="/"
          onClick={(event) => {
            event.preventDefault();
            navigateTo("/");
          }}
        >
          Back to books
        </a>
      </div>

      <section className="border rounded p-4">
        <h3 className="text-xl mb-2">Edit book</h3>
        <BookForm initialBook={model.book} submitText="Update Book" onSubmit={handleUpdate} />
      </section>

      <button
        type="button"
        className="bg-red-700 px-4 py-2 rounded w-fit"
        onClick={handleDelete}
      >
        Delete Book
      </button>
    </main>
  );
}
