using Mapster;
using KirbysBooks.Dtos;
using KirbysBooks.Interfaces;
using KirbysBooks.Models;
using KirbysBooks.Services;
using Microsoft.AspNetCore.Mvc;

namespace KirbysBooks.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BooksController(
    IBooksService booksService,
    IOpenLibraryService openLibraryService)
    : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<BookReadDto>>> Get()
    {
        var books = await booksService.GetAsync();
        var dtos = books.Select(b => b.Adapt<BookReadDto>(TypeAdapterConfig.GlobalSettings)).ToList();
        return Ok(dtos);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<BookReadDto>> GetById(int id)
    {
        var book = await booksService.GetAsync(id.ToString());
        if (book == null) return NotFound();
        return Ok(book.Adapt<BookReadDto>(TypeAdapterConfig.GlobalSettings));
    }

    [HttpPost]
    public async Task<ActionResult<BookReadDto>> Create([FromBody] BookCreateDto dto)
    {
        // ModelState validation is automatic because of [ApiController].
        var book = dto.Adapt<Book>(TypeAdapterConfig.GlobalSettings);
        var created = await booksService.CreateAsync(book);
        var readDto = created.Adapt<BookReadDto>(TypeAdapterConfig.GlobalSettings);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, readDto);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] BookCreateDto dto)
    {
        if (!ModelState.IsValid) return ValidationProblem(ModelState);

        var updatedBook = dto.Adapt<Book>(TypeAdapterConfig.GlobalSettings);
        var updated = await booksService.UpdateAsync(id.ToString(), updatedBook);
        if (updated == null) return NotFound();
        var readDto = updated.Adapt<BookReadDto>(TypeAdapterConfig.GlobalSettings);
        return Ok(readDto);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await booksService.RemoveAsync(id.ToString());
        if (deleted == null) return NotFound();
        var readDto = deleted.Adapt<BookReadDto>(TypeAdapterConfig.GlobalSettings);
        return Ok(readDto);
    }
    
    [HttpGet("openlibrary/{isbn}")]
    public async Task<IActionResult> GetFromOpenLibraryByIsbn(string isbn)
    {
        var book = await openLibraryService.GetBookByIsbnAsync(isbn);
        if (book == null) return NotFound();
        return Ok(book);
    }
}
