using KirbysBooks.Models;
using KirbysBooks.Data;
using Microsoft.EntityFrameworkCore;

namespace KirbysBooks.Services;

public class BooksService(AppDbContext db) : IBooksService
{
    public async Task<List<Book>> GetAsync() =>
        await db.Books.Include(b => b.Author).Include(b => b.Genres).ToListAsync();

    public async Task<Book?> GetAsync(string id)
    {
        if (!int.TryParse(id, out var intId)) return null;
        return await db.Books.Include(b => b.Author).Include(b => b.Genres)
            .FirstOrDefaultAsync(x => x.Id == intId);
    }

    public async Task<Book> CreateAsync(Book newBook)
    {
        // If AuthorId provided, ensure the Author navigation is null (we'll rely on FK)
        if (newBook.AuthorId.HasValue)
        {
            newBook.Author = null;
        }
        else if (newBook.Author != null)
        {
            // Try re-using existing author by name
            var existingAuthor = await db.Authors
                .FirstOrDefaultAsync(a => a.FirstName == newBook.Author.FirstName && a.LastName == newBook.Author.LastName);

            if (existingAuthor != null)
            {
                newBook.AuthorId = existingAuthor.Id;
            }
            else
            {
                // Add new author and ensure it's saved so Book can reference it
                db.Authors.Add(newBook.Author);
                await db.SaveChangesAsync();
                newBook.AuthorId = newBook.Author.Id;
            }

            newBook.Author = null;
        }

        db.Books.Add(newBook);
        await db.SaveChangesAsync();

        // Reload the saved book with navigations to return a fully populated entity
        var created = await db.Books.Include(b => b.Author).Include(b => b.Genres)
            .FirstOrDefaultAsync(b => b.Id == newBook.Id);
        return created!;
    }

    public async Task<Book?> UpdateAsync(string id, Book updatedBook)
    {
        if (!int.TryParse(id, out var intId)) return null;

        var existing = await db.Books
            .Include(b => b.Author)
            .Include(b => b.Genres)
            .FirstOrDefaultAsync(b => b.Id == intId);

        if (existing == null) return null;

        // Update scalar properties
        existing.Title = updatedBook.Title;
        existing.ISBN = updatedBook.ISBN;
        existing.Price = updatedBook.Price;
        existing.Description = updatedBook.Description;
        existing.PublishedDate = updatedBook.PublishedDate;
        existing.UpdatedAt = DateTime.UtcNow;

        // Handle author changes
        if (updatedBook.AuthorId.HasValue)
        {
            existing.AuthorId = updatedBook.AuthorId;
            existing.Author = null;
        }
        else if (updatedBook.Author != null)
        {
            var existingAuthor = await db.Authors
                .FirstOrDefaultAsync(a => a.FirstName == updatedBook.Author.FirstName && a.LastName == updatedBook.Author.LastName);

            if (existingAuthor != null)
            {
                existing.AuthorId = existingAuthor.Id;
                existing.Author = null;
            }
            else
            {
                db.Authors.Add(updatedBook.Author);
                await db.SaveChangesAsync();
                existing.AuthorId = updatedBook.Author.Id;
                existing.Author = null;
            }
        }

        // Update genres: replace existing set with provided ones
        existing.Genres.Clear();
        foreach (var g in updatedBook.Genres)
        {
            existing.Genres.Add(new Genre { Name = g.Name });
        }

        await db.SaveChangesAsync();

        // Reload the updated book with navigations and return it
        var updated = await db.Books.Include(b => b.Author).Include(b => b.Genres)
            .FirstOrDefaultAsync(b => b.Id == existing.Id);
        return updated;
    }

    public async Task<Book?> RemoveAsync(string id)
    {
        if (!int.TryParse(id, out var intId)) return null;
        // load book with navigations so we can return it after deletion
        var book = await db.Books.Include(b => b.Author).Include(b => b.Genres).FirstOrDefaultAsync(b => b.Id == intId);
        if (book == null) return null;
        // create a snapshot to return after deletion
        var snapshot = new Book
        {
            Id = book.Id,
            Title = book.Title,
            ISBN = book.ISBN,
            Price = book.Price,
            Description = book.Description,
            PublishedDate = book.PublishedDate,
            AuthorId = book.AuthorId,
            Author = book.Author,
            Genres = book.Genres.ToList()
        };

        db.Books.Remove(book);
        await db.SaveChangesAsync();
        return snapshot;
    }
}