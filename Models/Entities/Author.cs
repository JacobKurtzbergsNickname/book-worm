using System.ComponentModel.DataAnnotations;

namespace BookWorm.Models.Entities;

public class Author
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string FirstName { get; init; } = null!;

    [Required]
    [MaxLength(100)]
    public string LastName { get; init; } = null!;

    public DateTime? BirthDate { get; set; }

    public virtual ICollection<Book> Books { get; init; } = new List<Book>();

    public virtual ICollection<Genre> Genres { get; init; } = new List<Genre>();
}