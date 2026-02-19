using KirbysBooks.Models.OpenLibrary;

namespace KirbysBooks.Interfaces;

public interface IOpenLibraryService
{
    Task<OpenLibraryBook?> GetBookByIsbnAsync(string isbn, CancellationToken ct = default);
}