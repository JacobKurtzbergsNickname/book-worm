namespace KirbysBooks.Services;
    
    using System;
    using System.Net;
    using System.Net.Http;
    using System.Text.Json;
    using System.Threading;
    using System.Threading.Tasks;
    using KirbysBooks.Models;
    
    public class OpenLibraryService(HttpClient http) : IOpenLibraryService
    {
        private readonly JsonSerializerOptions _jsonOptions = new() { PropertyNameCaseInsensitive = true };

        public async Task<OpenLibraryBook?> GetBookByIsbnAsync(string isbn, CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(isbn)) throw new ArgumentException("ISBN required", nameof(isbn));
            var resp = await http.GetAsync($"isbn/{isbn}.json", ct);
    
            if (resp.StatusCode == HttpStatusCode.NotFound) return null;
            resp.EnsureSuccessStatusCode();
    
            await using var stream = await resp.Content.ReadAsStreamAsync(ct);
            var book = await JsonSerializer.DeserializeAsync<OpenLibraryBook>(stream, _jsonOptions, ct);
            return book;
        }
    }