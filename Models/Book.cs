using System.ComponentModel.DataAnnotations;

namespace KirbysBooks.Models;

public class Book
{
    public Book() { }

    public Book(CreateBook newBook)
    {
        ISBN = newBook.ISBN ?? string.Empty;
        Title = newBook.Title;
        Price = newBook.Price;
        Description = newBook.Description;
        PublishedDate = newBook.PublishedDate ?? DateTime.MinValue;
    }

    [Key]
    public int Id { get; set; }

    [MaxLength(20)]
    public string ISBN { get; set; } = null!;

    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = null!;

    public int? AuthorId { get; set; }
    public virtual Author? Author { get; set; }

    public virtual ICollection<Genre> Genres { get; set; } = new List<Genre>();

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public DateTime PublishedDate { get; set; } = DateTime.MinValue;

    public decimal Price { get; set; }

    public string? Description { get; set; }
}