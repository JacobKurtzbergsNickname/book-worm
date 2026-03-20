using BookWorm.Models.Entities;

namespace BookWorm.Interfaces;

public interface IBooksService
{
    Task<List<Book>> GetAsync();
    
    Task<Book?> GetAsync(string id);
    
    Task<Book> CreateAsync(Book newBook);
    
    Task<Book?> UpdateAsync(string id, Book updatedBook);
    
    Task<Book?> RemoveAsync(string id);
}