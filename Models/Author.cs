namespace KirbysBooks.Models;

public class Author
{
    public String FirstName { get; set; }
    public String LastName { get; set; }
    public String Email { get; set; }
    public DateTime BirthDate { get; set; }
    public virtual List<Book> Books { get; set; }
}