import {type JSX, useEffect, useState} from "react";
import axios from "axios";

interface Author {
    id: number;
    firstName: string;
    lastName: string;
    birthDate?: string;
}

interface Book {
    id: number;
    title: string;
    isbn: string;
    price: number;
    description?: string;
    publishedDate: string;
    authorId?: number;
    author?: Author;
    genres?: string[];
}

function Books(): JSX.Element {
    const [books, setBooks] = useState<Book[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | null>(null)
    useEffect(() => {
        axios.get("/api/books")
            .then(r => setBooks(r.data))
            .catch(() => setError("Failed to load books."))
            .finally(() => setLoading(false))
    }, []);
    return (
        <section className="text-center border-1 mt-5 mx-10">
            {loading && <p>Loading...</p>}
            {error && <p>{error}</p>}
            {!loading && !error && books.length === 0 && <p>No books found.</p>}
            {books.map(book => (
                <div key={book.id} className="border-1 m-2 p-2">
                    <h2 className="text-xl font-semibold">{book.title}</h2>
                    {book.author && (
                        <p>{book.author.firstName} {book.author.lastName}</p>
                    )}
                    <p>${book.price.toFixed(2)}</p>
                </div>
            ))}
        </section>
    )
}

export default Books;