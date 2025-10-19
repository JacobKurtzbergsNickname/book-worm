using KirbysBooks.Models;
using KirbysBooks.Services;
using Microsoft.AspNetCore.Mvc;

namespace KirbysBooks.Controllers;

public static class BooksEndpoints
{
    public static void Map(WebApplication app)
    {
        app.MapGet("/api/books", GetBooks);
    }
    
    private static async Task<IResult>  GetBooks(BooksService service)
    {
        List<Book> books = await service.GetAsync();
        return Results.Ok(books);
    }
}