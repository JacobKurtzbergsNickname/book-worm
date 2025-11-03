using Mapster;
using KirbysBooks.Dtos;
using KirbysBooks.Models;
using KirbysBooks.Services;
using Microsoft.AspNetCore.Mvc;

namespace KirbysBooks.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BooksController : ControllerBase
{
    private readonly BooksService _service;

    public BooksController(BooksService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<BookReadDto>>> Get()
    {
        var books = await _service.GetAsync();
        var dtos = books.Select(b => b.Adapt<BookReadDto>(TypeAdapterConfig.GlobalSettings)).ToList();
        return Ok(dtos);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<BookReadDto>> GetById(int id)
    {
        var book = await _service.GetAsync(id.ToString());
        if (book == null) return NotFound();
        return Ok(book.Adapt<BookReadDto>(TypeAdapterConfig.GlobalSettings));
    }

    [HttpPost]
    public async Task<ActionResult<BookReadDto>> Create([FromBody] BookCreateDto dto)
    {
        // ModelState validation is automatic because of [ApiController].
        var book = dto.Adapt<Book>(TypeAdapterConfig.GlobalSettings);
        await _service.CreateAsync(book);

        var readDto = book.Adapt<BookReadDto>(TypeAdapterConfig.GlobalSettings);
        return CreatedAtAction(nameof(GetById), new { id = book.Id }, readDto);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] BookCreateDto dto)
    {
        if (!ModelState.IsValid) return ValidationProblem(ModelState);

        var updated = dto.Adapt<Book>(TypeAdapterConfig.GlobalSettings);
        await _service.UpdateAsync(id.ToString(), updated);

        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        await _service.RemoveAsync(id.ToString());
        return NoContent();
    }
}
