using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace BookWorm.Dtos;

public class AuthorCreateDto
{
    [Required]
    [StringLength(100)]
    [JsonPropertyName("firstName")]
    public string FirstName { get; set; } = null!;

    [Required]
    [StringLength(100)]
    [JsonPropertyName("lastName")]
    public string LastName { get; set; } = null!;

    [JsonPropertyName("birthDate")]
    public DateTime? BirthDate { get; set; }
}

public class BookCreateDto
{
    [Required]
    [StringLength(200)]
    [JsonPropertyName("title")]
    public string Title { get; set; } = null!;

    // Either supply an existing author id, or provide a nested author to create
    [JsonPropertyName("authorId")]
    public int? AuthorId { get; set; }

    [JsonPropertyName("author")]
    public AuthorCreateDto? Author { get; set; }

    [JsonPropertyName("isbn")]
    [StringLength(20)]
    public string? ISBN { get; set; }

    [JsonPropertyName("publishedDate")]
    public DateTime? PublishedDate { get; set; }

    [Required]
    [Range(0, 10000)]
    [JsonPropertyName("price")]
    public decimal Price { get; set; }

    [StringLength(2000)]
    [JsonPropertyName("description")]
    public string? Description { get; set; }

    [JsonPropertyName("genre")]
    public List<string>? Genre { get; set; }
}
