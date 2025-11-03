using KirbysBooks.Models;
using KirbysBooks.Data;
using Microsoft.EntityFrameworkCore;

namespace KirbysBooks.Services;

public class BooksService
{
    private readonly AppDbContext _db;

    public BooksService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<Book>> GetAsync() =>
        await _db.Books.Include(b => b.Author).Include(b => b.Genres).ToListAsync();

    public async Task<Book?> GetAsync(string id)
    {
        if (!int.TryParse(id, out var intId)) return null;
        return await _db.Books.Include(b => b.Author).Include(b => b.Genres)
            .FirstOrDefaultAsync(x => x.Id == intId);
    }

    public async Task CreateAsync(Book newBook)
    {
        // If AuthorId provided, ensure the Author navigation is null (we'll rely on FK)
        if (newBook.AuthorId.HasValue)
        {
            newBook.Author = null;
        }
        else if (newBook.Author != null)
        {
            // Try re-using existing author by name
            var existingAuthor = await _db.Authors
                .FirstOrDefaultAsync(a => a.FirstName == newBook.Author.FirstName && a.LastName == newBook.Author.LastName);

            if (existingAuthor != null)
            {
                newBook.AuthorId = existingAuthor.Id;
            }
            else
            {
                // Add new author and ensure it's saved so Book can reference it
                _db.Authors.Add(newBook.Author);
                await _db.SaveChangesAsync();
                newBook.AuthorId = newBook.Author.Id;
            }

            newBook.Author = null;
        }

        _db.Books.Add(newBook);
        await _db.SaveChangesAsync();
    }

    public async Task UpdateAsync(string id, Book updatedBook)
    {
        if (!int.TryParse(id, out var intId)) return;

        var existing = await _db.Books
            .Include(b => b.Author)
            .Include(b => b.Genres)
            .FirstOrDefaultAsync(b => b.Id == intId);

        if (existing == null) return;

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
            var existingAuthor = await _db.Authors
                .FirstOrDefaultAsync(a => a.FirstName == updatedBook.Author.FirstName && a.LastName == updatedBook.Author.LastName);

            if (existingAuthor != null)
            {
                existing.AuthorId = existingAuthor.Id;
                existing.Author = null;
            }
            else
            {
                _db.Authors.Add(updatedBook.Author);
                await _db.SaveChangesAsync();
                existing.AuthorId = updatedBook.Author.Id;
                existing.Author = null;
            }
        }

        // Update genres: replace existing set with provided ones
        existing.Genres.Clear();
        if (updatedBook.Genres != null)
        {
            foreach (var g in updatedBook.Genres)
            {
                existing.Genres.Add(new Genre { Name = g.Name });
            }
        }

        await _db.SaveChangesAsync();
    }

    public async Task RemoveAsync(string id)
    {
        if (!int.TryParse(id, out var intId)) return;
        var book = await _db.Books.FindAsync(intId);
        if (book == null) return;
        _db.Books.Remove(book);
        await _db.SaveChangesAsync();
    }
}