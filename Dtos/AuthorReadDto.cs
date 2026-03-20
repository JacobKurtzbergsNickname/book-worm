using System;

namespace BookWorm.Dtos;

public class AuthorReadDto
{
    public int Id { get; init; }
    public string FirstName { get; init; } = null!;
    public string LastName { get; init; } = null!;
    public DateTime? BirthDate { get; init; }
}

