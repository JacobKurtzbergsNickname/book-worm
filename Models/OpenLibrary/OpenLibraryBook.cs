namespace KirbysBooks.Models.OpenLibrary;

public class OpenLibraryBook
{
    public string? Title { get; set; }
    public string? Subtitle { get; set; }
    public List<AuthorRef>? Authors { get; set; }
    public string? PublishDate { get; set; }
    public int? NumberOfPages { get; set; }
    public List<string>? Publishers { get; set; }
    public Dictionary<string, string[]?>? Identifiers { get; set; }
}