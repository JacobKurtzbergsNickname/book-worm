using Mapster;
using KirbysBooks.Dtos;
using KirbysBooks.Models.Entities;

namespace KirbysBooks.Mappings;

public static class MapsterConfig
{
    public static void Register(TypeAdapterConfig config)
    {
        // Entity -> Read DTO
        config.NewConfig<Book, BookReadDto>()
            .Map(dest => dest.AuthorId, src => src.AuthorId)
            .Map(dest => dest.Author, src => src.Author)
            .Map(dest => dest.Genres, src => src.Genres.Select(g => g.Name).ToList());

        config.NewConfig<Author, AuthorReadDto>();

        // Create DTO -> Entity
        config.NewConfig<BookCreateDto, Book>()
            .Map(dest => dest.ISBN, src => src.ISBN ?? string.Empty)
            .Map(dest => dest.PublishedDate, src => src.PublishedDate ?? DateTime.MinValue)
            .Map(dest => dest.AuthorId, src => src.AuthorId)
            .Map(dest => dest.Author, src => src.Author == null ? null : new Author { FirstName = src.Author.FirstName, LastName = src.Author.LastName, BirthDate = src.Author.BirthDate })
            .Map(dest => dest.Genres, src => src.Genre == null ? new List<Genre>() : src.Genre.Select(n => new Genre { Name = n }).ToList());

        config.NewConfig<AuthorCreateDto, Author>();
    }
}
