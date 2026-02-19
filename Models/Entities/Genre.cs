using System.ComponentModel.DataAnnotations;

namespace KirbysBooks.Models.Entities;

public class Genre
{
    [Key]
    public int Id { get; init; }

    [Required]
    [MaxLength(200)]
    public string Name { get; init; } = null!;

    [MaxLength(1000)]
    public string? Description { get; init; }

    [MaxLength(200)]
    public string? SuperGenre { get; init; }

    public virtual ICollection<Book> Books { get; init; } = new List<Book>();
}