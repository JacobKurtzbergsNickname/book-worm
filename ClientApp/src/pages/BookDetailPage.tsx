import { useEffect, useState } from "react";
import BookForm from "../components/BookForm";
import { deleteBook, getBookById, updateBook } from "../api/booksApi";
import type { Book } from "../types";
import { navigateTo } from "../routing";

type BookDetailPageProps = {
  id: string;
};

export default function BookDetailPage({ id }: BookDetailPageProps) {
  const [book, setBook] = useState<Book | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadBook(bookId: number) {
      try {
        setError("");
        const data = await getBookById(bookId);
        setBook(data);
      } catch {
        setError("Book not found.");
      }
    }

    void loadBook(Number(id));
  }, [id]);

  if (error) {
    return (
      <main className="p-5">
        <p role="alert">{error}</p>
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
      </main>
    );
  }

  if (!book) {
    return <p className="p-5">Loading...</p>;
  }

  return (
    <main className="mx-auto max-w-4xl p-5 grid gap-5">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl">Book: {book.title}</h2>
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
        <BookForm
          initialBook={book}
          submitText="Update Book"
          onSubmit={async (payload) => {
            const updated = await updateBook(Number(id), payload);
            setBook(updated);
          }}
        />
      </section>

      <button
        type="button"
        className="bg-red-700 px-4 py-2 rounded w-fit"
        onClick={async () => {
          await deleteBook(Number(id));
          navigateTo("/");
        }}
      >
        Delete Book
      </button>
    </main>
  );
}
