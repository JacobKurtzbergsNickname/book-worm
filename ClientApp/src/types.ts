export type Author = {
  firstName: string;
  lastName: string;
  birthDate?: string | null;
};

export type Book = {
  id: number;
  title: string;
  isbn: string;
  price: number;
  description?: string | null;
  publishedDate: string;
  authorId?: number | null;
  author?: Author | null;
  genres?: string[] | null;
};

export type BookCreatePayload = {
  title: string;
  isbn?: string;
  price: number;
  description?: string;
  publishedDate?: string;
  author?: Author;
  genre?: string[];
};
