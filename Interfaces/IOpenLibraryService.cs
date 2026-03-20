using BookWorm.Models.OpenLibrary;

namespace BookWorm.Interfaces;

public interface IOpenLibraryService
{
    Task<OpenLibraryBook?> GetBookByIsbnAsync(string isbn, CancellationToken ct = default);
}