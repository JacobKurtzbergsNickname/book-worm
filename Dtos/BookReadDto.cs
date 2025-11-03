using System;
using System.Collections.Generic;

namespace KirbysBooks.Dtos;

public class BookReadDto
{
    public int Id { get; init; }
    public string Title { get; init; } = null!;
    public string ISBN { get; init; } = null!;
    public decimal Price { get; init; }
    public string? Description { get; init; }
    public DateTime PublishedDate { get; init; }
    public int? AuthorId { get; init; }
    public AuthorReadDto? Author { get; init; }
    public List<string>? Genres { get; init; }
}
