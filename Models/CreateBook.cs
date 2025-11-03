// csharp
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace KirbysBooks.Models;

public class CreateBook
{
    [Required]
    [StringLength(200)]
    [JsonPropertyName("title")]
    public string Title { get; set; } = null!;

    [Required]
    [JsonPropertyName("author")]
    public AuthorDto Author { get; set; } = null!;

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