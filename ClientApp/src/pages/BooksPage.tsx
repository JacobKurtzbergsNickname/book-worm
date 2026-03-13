import { useEffect, useState } from "react";
import { navigateTo } from "../routing";
import { createBook, getBooks } from "../api/booksApi";
import type { Book } from "../types";
import BookForm from "../components/BookForm";

export default function BooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [error, setError] = useState("");

  async function loadBooks() {
    try {
      setError("");
      const data = await getBooks();
      setBooks(data);
    } catch {
      setError("Could not load books.");
    }
  }

  useEffect(() => {
    void loadBooks();
  }, []);

  return (
    <main className="mx-auto max-w-5xl p-5 grid gap-8">
      <section>
        <h2 className="text-2xl mb-3">All Books</h2>
        {error && <p role="alert">{error}</p>}
        <ul className="grid gap-2" aria-label="Book list">
          {books.map((book) => (
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
        <BookForm
          submitText="Create Book"
          onSubmit={async (payload) => {
            await createBook(payload);
            await loadBooks();
          }}
        />
      </section>
    </main>
  );
}
