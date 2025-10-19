using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

public class Book
{
    [BsonId] // Marks this as the _id field
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = default!;

    [BsonElement("title")]
    public string Title { get; set; } = default!;

    [BsonElement("author")]
    public string Author { get; set; } = default!;

    [BsonElement("genre")]
    public List<string> Genre { get; set; } = new();
}