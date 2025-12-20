using KirbysBooks.Models;

namespace KirbysBooks.Services;

public interface IOpenLibraryService
{
    Task<OpenLibraryBook?> GetBookByIsbnAsync(string isbn, CancellationToken ct = default);
}