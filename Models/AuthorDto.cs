using System;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace KirbysBooks.Models;

public class AuthorDto
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

